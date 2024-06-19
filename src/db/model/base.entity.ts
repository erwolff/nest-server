import { modelOptions, plugin, prop } from '@typegoose/typegoose';
import { Types } from 'mongoose';
import { mongooseLeanVirtuals } from 'mongoose-lean-virtuals';

@modelOptions({ schemaOptions: { timestamps: true } })
@plugin(mongooseLeanVirtuals)
export abstract class BaseEntity {
  @prop({ auto: true })
  readonly _id: Types.ObjectId;

  get id(): string {
    return this._id?.toHexString();
  }

  @prop({ auto: true, type: Number })
  public readonly createdAt!: number;

  @prop({ auto: true, type: Number })
  public readonly updatedAt!: number;
}
