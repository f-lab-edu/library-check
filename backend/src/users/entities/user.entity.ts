import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { BoardComment } from 'src/board/entities/board-comment.entity';
import { BoardPost } from 'src/board/entities/board-post.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255 })
  password: string;

  @Column({ nullable: true, length: 100 })
  nickname?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => BoardPost, (post) => post.user)
  posts: BoardPost[];

  @OneToMany(() => BoardComment, (comment) => comment.user)
  comments: BoardComment[];
}
