import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { DevicesService } from "./devices.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("devices")
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Post()
  register(@CurrentUser() user: { id: string }, @Body() body: { deviceId: string; platform: string; pushToken: string }) {
    return this.devices.register(user.id, body);
  }

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.devices.list(user.id);
  }

  @Delete(":deviceId")
  unregister(@CurrentUser() user: { id: string }, @Param("deviceId") deviceId: string) {
    return this.devices.unregister(user.id, deviceId);
  }
}
