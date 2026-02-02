import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Dependency } from "./dependency.entity";
import { Vulnerability } from "./vulnerability.entity";

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id:number;

  @Column({ length:255 })
  name: string;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(()=> User)
  @JoinColumn({name:'user_id'})
  user:User;

  @OneToMany(() => Dependency, (dependency) => dependency.project, {
    cascade: true,
  })
  dependencies: Dependency[];

  @OneToMany(() => Vulnerability, (vulnerability) => vulnerability.project)
  vulnerabilities: Vulnerability[];

  @Column({
    type: 'enum',
    enum:['pending', 'scanning', 'completed', 'failed'],
    default: 'pending'
  })
  scanStatus: string;

  @CreateDateColumn({name: 'created_at'})
  createdAt: Date;

  @UpdateDateColumn({name: 'updated_at'})
  updatedAt: Date;
}
