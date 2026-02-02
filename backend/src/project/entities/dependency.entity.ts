import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Project } from "./project.entity";

@Entity('dependencies')
export class Dependency {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({name: 'project_id'})
  projectId: number;
  
  @ManyToOne(() => Project, (project) => project.dependencies, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({name: 'project_id'})
  project:Project;

  @Column({length:255})
  name: string;

  @Column({length: 50})
  version: string;

  @Column({
    type: 'enum',
    enum: ['production', 'development'],
    default: 'production',
  })
  type: string;
  
  @CreateDateColumn({name: 'created_at'})
  createdAt: Date;
}