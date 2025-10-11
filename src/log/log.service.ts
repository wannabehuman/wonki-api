import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

export interface LogOptions {
  userId?: string;
  username?: string;
  tableName: string;
  recordId?: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  description?: string;
}

@Injectable()
export class LogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(options: LogOptions): Promise<void> {
    try {
      const log = this.auditLogRepository.create({
        user_id: options.userId || 'system',
        username: options.username || 'system',
        table_name: options.tableName,
        record_id: options.recordId,
        operation: options.operation,
        old_value: options.oldValue ? JSON.stringify(options.oldValue) : null,
        new_value: options.newValue ? JSON.stringify(options.newValue) : null,
        ip_address: options.ipAddress,
        description: options.description,
      });

      await this.auditLogRepository.save(log);
    } catch (error) {
      console.error('Failed to save audit log:', error);
      // Don't throw error to prevent blocking main operation
    }
  }

  async findAll(): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      order: { timestamp: 'DESC' },
    });
  }

  async findByTable(tableName: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { table_name: tableName },
      order: { timestamp: 'DESC' },
    });
  }

  async findByUser(userId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { user_id: userId },
      order: { timestamp: 'DESC' },
    });
  }

  async findByRecordId(tableName: string, recordId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: {
        table_name: tableName,
        record_id: recordId
      },
      order: { timestamp: 'DESC' },
    });
  }
}
