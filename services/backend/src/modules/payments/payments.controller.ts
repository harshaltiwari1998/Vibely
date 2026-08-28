import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
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
  verify(@CurrentUser() user: { id: string }, @Param("paymentId") paymentId: string) {
    return this.payments.verifyPayment(paymentId);
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

  /** Public webhook endpoint for the payment provider (no auth). */
  @Post("webhook")
  webhook(@Body() body: { provider: string; payload: unknown; signature?: string }) {
    return this.payments.handleWebhook(body.provider, body.payload, body.signature);
  }
}
