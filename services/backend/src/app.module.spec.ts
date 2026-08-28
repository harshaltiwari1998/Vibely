import { Test } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { PrismaService } from "./database/prisma.service";
import { RedisService } from "./cache/redis.service";
import { MatchingService } from "./modules/matching/matching.service";
import { CallsService } from "./modules/calls/calls.service";
import { ChatService } from "./modules/chat/chat.service";
import { GiftsService } from "./modules/gifts/gifts.service";
import { WalletService } from "./modules/wallet/wallet.service";
import { PaymentsService } from "./modules/payments/payments.service";
import { NotificationsService } from "./modules/notifications/notifications.service";
import { DevicesService } from "./modules/devices/devices.service";
import { PushNotificationService } from "./modules/push/push-notification.service";
import { TranslationService } from "./modules/translation/translation.service";
import { FraudDetectionService } from "./modules/fraud/fraud-detection.service";
import { RealtimeGateway } from "./realtime/realtime.gateway";
import { PresenceService } from "./realtime/presence.service";

describe("AppModule (foundation smoke test)", () => {
  let app: INestApplication;

  const mockPrisma = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
  } as unknown as PrismaService;

  const mockRedis = {
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    ping: jest.fn().mockResolvedValue("PONG"),
    getClient: jest.fn().mockReturnValue({
      set: jest.fn().mockResolvedValue("OK"),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(0),
      scan: jest.fn().mockResolvedValue(["0", []]),
      ttl: jest.fn().mockResolvedValue(-2),
      zadd: jest.fn().mockResolvedValue(0),
      zrange: jest.fn().mockResolvedValue([]),
      zrem: jest.fn().mockResolvedValue(0),
      sadd: jest.fn().mockResolvedValue(0),
      smembers: jest.fn().mockResolvedValue([]),
      expire: jest.fn().mockResolvedValue(1),
      incr: jest.fn().mockResolvedValue(1),
    }),
    isReady: jest.fn().mockReturnValue(true),
    set: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(undefined),
    zAdd: jest.fn().mockResolvedValue(undefined),
    zRange: jest.fn().mockResolvedValue([]),
    zRem: jest.fn().mockResolvedValue(undefined),
    sAdd: jest.fn().mockResolvedValue(undefined),
    sMembers: jest.fn().mockResolvedValue([]),
    expire: jest.fn().mockResolvedValue(undefined),
    incr: jest.fn().mockResolvedValue(1),
  } as unknown as RedisService;

  const mockMatching = {
    requestMatch: jest.fn().mockResolvedValue({ status: "WAITING" }),
    cancelMatch: jest.fn().mockResolvedValue({ success: true }),
    acceptMatch: jest.fn().mockResolvedValue({ success: true }),
    declineMatch: jest.fn().mockResolvedValue({ success: true }),
    skipMatch: jest.fn().mockResolvedValue({ success: true }),
    handleDisconnect: jest.fn().mockResolvedValue(undefined),
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
  } as unknown as MatchingService;

  const mockPresence = {
    markOnline: jest.fn().mockResolvedValue(undefined),
    markOffline: jest.fn().mockResolvedValue(undefined),
    heartbeat: jest.fn().mockResolvedValue(undefined),
    getSocketId: jest.fn().mockResolvedValue(null),
  } as unknown as PresenceService;

  const mockGateway = {
    server: { to: jest.fn(() => ({ emit: jest.fn() })), emit: jest.fn() },
    handleConnection: jest.fn(),
    handleDisconnect: jest.fn(),
    presence: mockPresence,
    payments: {
      getPackages: jest.fn().mockResolvedValue([]),
      createPayment: jest.fn().mockResolvedValue({ paymentId: "pay-1", providerRef: "ref-1", amount: 100, currency: "INR", status: "PENDING" }),
      verifyPayment: jest.fn().mockResolvedValue({ paymentId: "pay-1", status: "SUCCEEDED", amount: 100, currency: "INR" }),
      handleWebhook: jest.fn().mockResolvedValue({ success: true }),
      getPaymentStatus: jest.fn().mockResolvedValue({ paymentId: "pay-1", status: "PENDING", amount: 100, currency: "INR" }),
      listTransactions: jest.fn().mockResolvedValue({ items: [], total: 0 }),
      refundPayment: jest.fn().mockResolvedValue({ refundId: "rfnd-1", paymentId: "pay-1", amount: 100, status: "PROCESSING" }),
    },
  } as unknown as RealtimeGateway;

  const mockCalls = {
    initiate: jest.fn().mockResolvedValue({ id: "call-1", status: "RINGING" }),
    endCall: jest.fn().mockResolvedValue({ status: "ENDED" }),
    acceptCall: jest.fn().mockResolvedValue({ status: "ACTIVE" }),
    rejectCall: jest.fn().mockResolvedValue({ status: "REJECTED" }),
    failCall: jest.fn().mockResolvedValue({ status: "FAILED" }),
    listHistory: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    getCall: jest.fn().mockResolvedValue({ id: "call-1" }),
  } as unknown as CallsService;

  const mockChat = {
    listChats: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    getMessages: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    sendMessage: jest.fn().mockResolvedValue({ id: "msg-1", content: "hello", status: "SENT" }),
    markDelivered: jest.fn().mockResolvedValue(undefined),
    markRead: jest.fn().mockResolvedValue(undefined),
    reportMessage: jest.fn().mockResolvedValue({ success: true }),
    blockUser: jest.fn().mockResolvedValue({ success: true }),
    unblockUser: jest.fn().mockResolvedValue({ success: true }),
    reportUser: jest.fn().mockResolvedValue({ success: true }),
  } as unknown as ChatService;

  const mockGifts = {
    listGifts: jest.fn().mockResolvedValue([]),
    sendGift: jest.fn().mockResolvedValue({ id: "gift-1", giftId: "gift-1", senderId: "u1", receiverId: "u2", coinAmount: 10 }),
    getGiftHistory: jest.fn().mockResolvedValue({ sent: [], received: [] }),
    createGift: jest.fn().mockResolvedValue({ id: "gift-new" }),
    updateGift: jest.fn().mockResolvedValue({ id: "gift-1" }),
    deleteGift: jest.fn().mockResolvedValue({ id: "gift-1" }),
  } as unknown as GiftsService;

  const mockWallet = {
    getBalance: jest.fn().mockResolvedValue({ balance: 0 }),
    getTransactions: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    addCoins: jest.fn().mockResolvedValue({ wallet: { balance: 0 }, transaction: { id: "tx-1" } }),
    deductCoins: jest.fn().mockResolvedValue({ wallet: { balance: 0 }, transaction: { id: "tx-2" } }),
    sendGiftCoins: jest.fn().mockResolvedValue({}),
    adminAdjust: jest.fn().mockResolvedValue({ wallet: { balance: 0 }, transaction: { id: "tx-3" } }),
  } as unknown as WalletService;

  const mockPayments = {
    getPackages: jest.fn().mockResolvedValue([]),
    createPayment: jest.fn().mockResolvedValue({ paymentId: "pay-1", providerRef: "ref-1", amount: 100, currency: "INR", status: "PENDING" }),
    verifyPayment: jest.fn().mockResolvedValue({ paymentId: "pay-1", status: "SUCCEEDED", amount: 100, currency: "INR" }),
    handleWebhook: jest.fn().mockResolvedValue({ success: true }),
    getPaymentStatus: jest.fn().mockResolvedValue({ paymentId: "pay-1", status: "PENDING", amount: 100, currency: "INR" }),
    listTransactions: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    refundPayment: jest.fn().mockResolvedValue({ refundId: "rfnd-1", paymentId: "pay-1", amount: 100, status: "PROCESSING" }),
  } as unknown as PaymentsService;

  const mockNotifications = {
    list: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    markRead: jest.fn().mockResolvedValue({ id: "notif-1", read: true }),
    markAllRead: jest.fn().mockResolvedValue({ success: true }),
    delete: jest.fn().mockResolvedValue({ success: true }),
    createNotification: jest.fn().mockResolvedValue({ id: "notif-1" }),
    getUnreadCount: jest.fn().mockResolvedValue({ count: 0 }),
  } as unknown as NotificationsService;

  const mockDevices = {
    register: jest.fn().mockResolvedValue({ id: "device-1", deviceId: "dev-1" }),
    list: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    unregister: jest.fn().mockResolvedValue({ success: true }),
    getDevicesByUser: jest.fn().mockResolvedValue([]),
  } as unknown as DevicesService;

  const mockPush = {
    sendToDevice: jest.fn().mockResolvedValue({ success: true, provider: "fcm" }),
  } as unknown as PushNotificationService;

  const mockTranslation = {
    translateText: jest.fn().mockResolvedValue({ originalText: "hello", translatedText: "[hi] hello", sourceLanguage: "en", targetLanguage: "hi" }),
    detectLanguage: jest.fn().mockResolvedValue({ language: "en", confidence: 0.9 }),
    getSupportedLanguages: jest.fn().mockReturnValue(["en", "hi"]),
    isLanguageSupported: jest.fn().mockReturnValue(true),
  } as unknown as TranslationService;

  const mockFraud = {
    analyzeUser: jest.fn().mockResolvedValue({ userId: "u1", flags: [], riskScore: 0, recommendation: "OK", metrics: {} }),
    detectPaymentFraud: jest.fn().mockResolvedValue({ flagged: false, reasons: [] }),
    detectGiftFraud: jest.fn().mockResolvedValue({ flagged: false, reasons: [] }),
  } as unknown as FraudDetectionService;

  it("compiles, initializes and tears down without throwing", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(RedisService)
      .useValue(mockRedis)
      .overrideProvider(MatchingService)
      .useValue(mockMatching)
      .overrideProvider(PresenceService)
      .useValue(mockPresence)
      .overrideProvider(CallsService)
      .useValue(mockCalls)
      .overrideProvider(ChatService)
      .useValue(mockChat)
      .overrideProvider(GiftsService)
      .useValue(mockGifts)
      .overrideProvider(WalletService)
      .useValue(mockWallet)
      .overrideProvider(PaymentsService)
      .useValue(mockPayments)
      .overrideProvider(NotificationsService)
      .useValue(mockNotifications)
      .overrideProvider(DevicesService)
      .useValue(mockDevices)
      .overrideProvider(PushNotificationService)
      .useValue(mockPush)
      .overrideProvider(TranslationService)
      .useValue(mockTranslation)
      .overrideProvider(FraudDetectionService)
      .useValue(mockFraud)
      .overrideProvider(RealtimeGateway)
      .useValue(mockGateway)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    expect(app).toBeDefined();
    await app.close();
  }, 10000);
});
