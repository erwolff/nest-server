import { BaseEntity } from '@/db/model';
import { modelOptions, prop } from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { collection: 'movies' } })
export class Movie extends BaseEntity {
  @prop({ type: String, required: true, index: true, unique: true })
  title: string;

  @prop({ type: String, required: true, index: true })
  genres: string[];

  @prop({ type: Number })
  releaseYear: number;

  @prop({ type: Number })
  runtimeMins: number;
}
