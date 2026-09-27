import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';

interface UserRecord {
  id: string;
  username: string;
  normalizedUsername: string;
  salt: Buffer;
  passwordHash: Buffer;
}

export class AuthError extends Error {
  constructor(readonly code: string, message: string, readonly status: number) {
    super(message);
  }
}

export class AuthService {
  private readonly usersByName = new Map<string, UserRecord>();
  private readonly usersById = new Map<string, UserRecord>();
  private readonly sessions = new Map<string, string>();

  register(usernameInput: unknown, passwordInput: unknown) {
    const username = this.validateUsername(usernameInput);
    const password = this.validatePassword(passwordInput);
    const normalizedUsername = username.toLowerCase();
    if (this.usersByName.has(normalizedUsername)) throw new AuthError('USERNAME_TAKEN', '用户名已存在', 409);
    const salt = randomBytes(16);
    const user: UserRecord = {
      id: randomUUID(), username, normalizedUsername, salt,
      passwordHash: scryptSync(password, salt, 32)
    };
    this.usersByName.set(normalizedUsername, user);
    this.usersById.set(user.id, user);
    return this.publicUser(user);
  }

  login(usernameInput: unknown, passwordInput: unknown) {
    const username = typeof usernameInput === 'string' ? usernameInput.trim().toLowerCase() : '';
    const password = typeof passwordInput === 'string' ? passwordInput : '';
    const user = this.usersByName.get(username);
    const candidate = user ? scryptSync(password, user.salt, 32) : Buffer.alloc(32);
    if (!user || !timingSafeEqual(candidate, user.passwordHash)) throw new AuthError('INVALID_CREDENTIALS', '用户名或密码错误', 401);
    return this.publicUser(user);
  }

  createSession(userId: string): string {
    const token = randomBytes(32).toString('hex');
    this.sessions.set(token, userId);
    return token;
  }

  userForToken(token: string | undefined) {
    if (!token) return null;
    const userId = this.sessions.get(token);
    const user = userId ? this.usersById.get(userId) : undefined;
    return user ? this.publicUser(user) : null;
  }

  destroySession(token: string | undefined): void {
    if (token) this.sessions.delete(token);
  }

  private validateUsername(input: unknown): string {
    if (typeof input !== 'string' || !/^[A-Za-z0-9_-]{3,32}$/.test(input.trim())) throw new AuthError('INVALID_USERNAME', '用户名格式无效', 400);
    return input.trim();
  }

  private validatePassword(input: unknown): string {
    if (typeof input !== 'string' || input.length < 8 || input.length > 72) throw new AuthError('INVALID_PASSWORD', '密码长度必须为 8 至 72 个字符', 400);
    return input;
  }

  private publicUser(user: UserRecord) {
    return { id: user.id, username: user.username };
  }
}
