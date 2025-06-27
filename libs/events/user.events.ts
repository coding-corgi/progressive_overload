export interface IValidateUserEvent {
  userId: string;
}

export interface IUserValidatedEvent {
  userId: string;
}

export interface IUserNotFoundEvent {
  userId: string;
  reason?: string;
}

export class ValidateUserEvent implements IValidateUserEvent {
  constructor(public readonly userId: string) {}
}

export class UserValidatedEvent implements IUserValidatedEvent {
  constructor(public readonly userId: string) {}
}

export class UserNotFoundEvent implements IUserNotFoundEvent {
  constructor(
    public readonly userId: string,
    public readonly reason?: string,
  ) {}
}
