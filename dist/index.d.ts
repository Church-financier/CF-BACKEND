import { Server as SocketIOServer } from "socket.io";
declare const io: SocketIOServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export declare function emitToOrganization(organizationId: string, event: string, payload: unknown): void;
export { io };
//# sourceMappingURL=index.d.ts.map