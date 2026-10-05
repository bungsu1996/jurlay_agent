import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Employee } from "./Employee";

@Entity("direct_messages")
export class DirectMessage {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 36 })
  employee_id!: string;

  @ManyToOne(() => Employee, { onDelete: "CASCADE" })
  @JoinColumn({ name: "employee_id" })
  employee!: Employee;

  @Column({ type: "varchar", length: 50, default: "CEO" })
  sender!: string; // "CEO" or "EMPLOYEE"

  @Column({ type: "text" })
  content!: string;

  @CreateDateColumn()
  created_at!: Date;
}
