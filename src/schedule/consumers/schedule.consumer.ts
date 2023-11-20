import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { SchedulesService } from '../services/schedule.service';
import { ScheduleConsumerDto } from '../dto/consumer.dto';

@Injectable()
export class ScheduleConsumer {
    constructor(
        private readonly scheduleService: SchedulesService
    ) { }

    @RabbitRPC({
        exchange: 'healthline.consultation.schedule',
        routingKey: 'schedule',
        queue: 'working_times',
    })
    async getDoctorSchedules(dto: ScheduleConsumerDto) {
        return await this.scheduleService.workingTimeByDate(dto.doctor, dto.date)
    }
}