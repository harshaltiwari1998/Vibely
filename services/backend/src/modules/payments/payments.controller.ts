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
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/constants/roles";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get("packages")
  packages() {
    return this.payments.getPackages();
  }

  @Post("create")
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: { id: string },
    @Body() body: { packageId?: string; playProductId?: string; idempotencyKey?: string; externalTransactionToken?: string },
  ) {
    return this.payments.createPayment(user.id, body);
  }

  /** Android: credit a purchase completed through Google Play Billing. */
  @Post("google-play/verify")
  @UseGuards(JwtAuthGuard)
  verifyGooglePlay(@CurrentUser() user: { id: string }, @Body() body: { productId?: string; purchaseToken?: string }) {
    if (!body.productId || !body.purchaseToken) {
      throw new BadRequestException("productId and purchaseToken are required");
    }
    return this.payments.verifyGooglePlayPurchase(user.id, body.productId, body.purchaseToken);
  }

  @Post(":paymentId/verify")
  @UseGuards(JwtAuthGuard)
  verify(
    @CurrentUser() user: { id: string },
    @Param("paymentId") paymentId: string,
    @Body() body: { providerPaymentId?: string; signature?: string },
  ) {
    return this.payments.verifyPayment(user.id, paymentId, body.providerPaymentId, body.signature);
  }

  @Post(":paymentId/refund")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
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
    return this.payments.getPaymentStatus(user.id, paymentId);
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
