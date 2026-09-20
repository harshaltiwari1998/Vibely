import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { PaymentsService } from "./payments.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get("packages")
  packages() {
    return this.payments.getPackages();
  }

  @Post("create")
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: { id: string }, @Body() body: { packageId?: string; coins?: number; amount?: number; currency?: string; idempotencyKey?: string }) {
    return this.payments.createPayment(user.id, body);
  }

  @Post(":paymentId/verify")
  @UseGuards(JwtAuthGuard)
  verify(
    @CurrentUser() user: { id: string },
    @Param("paymentId") paymentId: string,
    @Body() body: { providerPaymentId?: string; signature?: string },
  ) {
    return this.payments.verifyPayment(paymentId, body.providerPaymentId, body.signature);
  }

  @Post(":paymentId/refund")
  @UseGuards(JwtAuthGuard)
  refund(
    @CurrentUser() user: { id: string },
    @Param("paymentId") paymentId: string,
    @Body() body: { amount?: number; reason?: string },
  ) {
    return this.payments.refundPayment(paymentId, body.amount, body.reason);
  }

  @Get(":paymentId/status")
  @UseGuards(JwtAuthGuard)
  status(@CurrentUser() user: { id: string }, @Param("paymentId") paymentId: string) {
    return this.payments.getPaymentStatus(paymentId);
  }

  @Get("transactions")
  @UseGuards(JwtAuthGuard)
  transactions(@CurrentUser() user: { id: string }) {
    return this.payments.listTransactions(user.id);
  }

  /** Public webhook endpoint Razorpay calls directly (no auth) — configure this URL in the Razorpay dashboard. */
  @Post("webhook/razorpay")
  webhook(@Req() req: Request, @Headers("x-razorpay-signature") signature: string) {
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!rawBody) {
      throw new BadRequestException("Missing raw request body");
    }
    return this.payments.handleWebhook(rawBody, signature);
  }
}
