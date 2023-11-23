import { Body, Controller, Patch, Post, Get, UseGuards, Req, Inject, Param } from "@nestjs/common";
import { DoctorService } from "../services/doctor.service";
import { UpdateBiograpyProfile, UpdateEmail, UpdateFixedTime, UpdateImageProfile } from "../dto/updateProfile.dto";
import { SignUpDto } from "../dto/signUp.dto";
import { DoctorGuard } from "../../auth/guards/doctor.guard";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Specialty } from "../../config/enum.constants";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { AdminGuard } from "src/auth/guards/admin.guard";
import { AmqpConnection } from "@golevelup/nestjs-rabbitmq";

@ApiTags('PROFILE')
@Controller('doctor')
export class DoctorController {
    constructor(
        private readonly doctorService: DoctorService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private readonly amqpConnection: AmqpConnection
    ) { }

    @UseGuards(true ? DoctorGuard : AdminGuard)
    @ApiOperation({ summary: 'Lấy thông tin tài khoản bác sĩ' })
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: 'Lấy thông tin tài khoản thành công' })
    @ApiResponse({ status: 401, description: 'Tài khoản chưa được xác thực' })
    @Get()
    async profileDoctor(
        @Req() req
    ): Promise<any> {
        const cache = await this.cacheManager.get('doctor-' + req.user.id)
        if (cache) return cache

        const data = await this.doctorService.profileDoctor(req.user.id)

        await this.cacheManager.set('doctor-' + req.user.id, data)

        return data
    }

    @ApiOperation({ summary: 'Đăng kí tài khoản bác sĩ (tạm thời chưa có sms 2fa)' })
    @ApiResponse({ status: 201, description: 'Tạo tài khoản thành công' })
    @ApiResponse({ status: 400, description: 'Đầu vào không hợp lệ' })
    @ApiResponse({ status: 409, description: 'Số điện thoại đã được đăng kí' })
    @ApiParam({ name: 'specialty', enum: Specialty })
    @Post()
    async signUpDoctor(
        @Body() dto: SignUpDto
    ): Promise<any> {
        return await this.doctorService.signup(dto)
    }

    @UseGuards(DoctorGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Thay đổi biography của bác sĩ' })
    @ApiResponse({ status: 200, description: 'Thành công' })
    @ApiResponse({ status: 400, description: 'Sai đầu vào' })
    @Patch('biography')
    async updateBiographyProfile(
        @Body() dto: UpdateBiograpyProfile,
        @Req() req
    ): Promise<any> {
        await this.cacheManager.del('doctor-' + req.user.id)

        return await this.doctorService.updateBiography(dto, req.user.id)
    }

    @UseGuards(DoctorGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Thay đổi email của bác sĩ' })
    @ApiResponse({ status: 200, description: 'Thành công' })
    @ApiResponse({ status: 400, description: 'Sai đầu vào' })
    @Patch('email')
    async updateEmail(
        @Body() dto: UpdateEmail,
        @Req() req
    ): Promise<any> {
        await this.cacheManager.del('doctor-' + req.user.id)

        return await this.doctorService.updateEmail(dto, req.user.id)
    }

    @UseGuards(DoctorGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Thay đổi avatar của bác sĩ' })
    @ApiResponse({ status: 200, description: 'Thành công' })
    @ApiResponse({ status: 400, description: 'Sai đầu vào' })
    @Patch('avatar')
    async updateImageProfile(
        @Body() dto: UpdateImageProfile,
        @Req() req
    ): Promise<any> {
        await this.cacheManager.del('doctor-' + req.user.id)

        return await this.doctorService.updateImage(dto, req.user.id)
    }

    @UseGuards(DoctorGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Thay đổi thời gian làm việc cố định của bác sĩ' })
    @ApiResponse({ status: 200, description: 'Thành công' })
    @ApiResponse({ status: 400, description: 'Sai đầu vào' })
    @Patch('fixed-times')
    async updateFixedTimes(
        @Body() dto: UpdateFixedTime,
        @Req() req
    ): Promise<any> {
        await this.cacheManager.del('doctor-' + req.user.id)

        return await this.doctorService.updatedFixedTime(dto, req.user.id)
    }

    @UseGuards(AdminGuard)
    @ApiBearerAuth()
    @Get('quantity')
    async quantity() {
        return await this.doctorService.doctorCount()
    }

    @UseGuards(AdminGuard)
    @ApiBearerAuth()
    @Get('information/:page/:num')
    async information(
        @Param('page') page: number,
        @Param('num') num: number
    ) {
        const cacheSchedules = await this.cacheManager.get('doctorInformation-' + page + '-' + num);
        if (cacheSchedules) return cacheSchedules

        const information = await this.amqpConnection.request<string>({
            exchange: 'healthline.doctor.information',
            routingKey: 'information'
        })
        const data = await this.doctorService.getAllDoctorPerPage(page, num, information)

        await this.cacheManager.set('doctorInformation-' + page + '-' + num, data)

        return data
    }
}