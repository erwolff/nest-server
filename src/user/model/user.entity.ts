import { AuthRole } from '@/auth/model';
import { BaseEntity } from '@/db/model';
import { modelOptions, prop } from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { collection: 'users' } })
export class User extends BaseEntity {
  @prop({ type: String, required: true, index: true, unique: true, lowercase: true })
  email: string;

  @prop({ type: String })
  password: string;

  @prop({ type: String, enum: AuthRole })
  roles: AuthRole[];
}
