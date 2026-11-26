# Tablero de control en tiempo real

El tablero se carga primero por REST y después recibe únicamente cambios nuevos
por Socket.IO.

## 1. Estado inicial por REST

```http
GET /election-day/control-board/:campaignId
Authorization: Bearer <JWT>
```

La variante anterior continúa disponible:

```http
GET /election-day/control-board?campaignId=:campaignId
```

## 2. URL del WebSocket

Desarrollo:

```text
http://localhost:3000/election-day
```

Es un namespace de **Socket.IO**, no un WebSocket plano. El frontend debe usar
`socket.io-client`.

## 3. Autenticación y suscripción

Enviar el JWT en `auth.token`. Se acepta con o sin prefijo `Bearer`.

La forma recomendada incluye `campaignId` en el handshake. Así, después de una
reconexión el backend vuelve a unir el socket a `campaign:{campaignId}`.

```ts
import { io } from 'socket.io-client';

const campaignId = 17;

const socket = io('http://localhost:3000/election-day', {
  auth: {
    token: accessToken,
    campaignId,
  },
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});
```

También se puede suscribir manualmente. La suscripción debe enviarse dentro de
`connect` para que se repita después de cada reconexión:

```ts
const socket = io('http://localhost:3000/election-day', {
  auth: { token: accessToken },
  reconnection: true,
});

socket.on('connect', () => {
  socket.emit(
    'election-day.subscribe',
    { campaignId: 17 },
    (response: { ok: boolean; campaignId: number; room: string }) => {
      console.log(response); // room: campaign:17
    },
  );
});
```

Para salir de una sala:

```ts
socket.emit('election-day.unsubscribe', { campaignId: 17 });
```

## 4. Eventos disponibles

Todos los mensajes tienen esta envoltura:

```ts
type ElectionDayEvent<T> = {
  campaignId: number;
  event:
    | 'election-day.report.created'
    | 'election-day.table.updated'
    | 'election-day.novelty.created';
  data: T;
};
```

### `election-day.report.created`

Se emite después de guardar un reporte.

```json
{
  "campaignId": 17,
  "event": "election-day.report.created",
  "data": {
    "tableId": 1,
    "reportId": 24,
    "votingBoothId": 876,
    "tableNumber": 1,
    "status": "en_operacion",
    "estimatedParticipation": 45,
    "hasEvidence": true,
    "createdAt": "2026-11-24T11:42:36.953Z"
  }
}
```

### `election-day.table.updated`

Se emite junto con el reporte cuando cambia el estado actual de la mesa. Usa el
mismo payload de `election-day.report.created`.

```json
{
  "campaignId": 17,
  "event": "election-day.table.updated",
  "data": {
    "tableId": 1,
    "reportId": 24,
    "votingBoothId": 876,
    "tableNumber": 1,
    "status": "en_operacion",
    "estimatedParticipation": 45,
    "hasEvidence": true,
    "createdAt": "2026-11-24T11:42:36.953Z"
  }
}
```

### `election-day.novelty.created`

```json
{
  "campaignId": 17,
  "event": "election-day.novelty.created",
  "data": {
    "id": 6,
    "severity": "critica",
    "title": "Votante invalidado",
    "description": "Descripción",
    "votingBoothId": 876,
    "tableNumber": 1,
    "createdAt": "2026-11-24T11:42:36.953Z"
  }
}
```

## 5. Escucha en el frontend

```ts
socket.on('election-day.report.created', (payload) => {
  // Agregar reporte y actualizar el contador de reportes.
});

socket.on('election-day.table.updated', (payload) => {
  // Reemplazar el estado de la mesa y recalcular KPIs.
});

socket.on('election-day.novelty.created', (payload) => {
  // Agregar novedad, ordenar por severidad/fecha y actualizar contadores.
});

socket.on('election-day.error', ({ message }) => {
  console.error(message);
});
```

## 6. Autorización

Para entrar en `campaign:{campaignId}`, el usuario debe:

1. Tener un JWT válido y no expirado.
2. Tener el permiso `control-board:read`.
3. Estar asociado al `campaignId` solicitado mediante `campaign_users`.

No basta con conocer el ID de la campaña. Si alguna validación falla, el socket
no entra a la sala. Si falla la autenticación inicial, el backend emite
`election-day.error` y desconecta al cliente.

## 7. Flujo recomendado

1. Abrir el tablero.
2. Consultar `GET /election-day/control-board/:campaignId`.
3. Renderizar el estado inicial.
4. Conectar Socket.IO y suscribirse a la campaña.
5. Aplicar los eventos posteriores sobre el estado local.
6. Ante reconexión, volver a suscribirse (automático si `campaignId` está en
   `auth`; manual si se usa `election-day.subscribe`).
7. Al cambiar de campaña, desconectar o salir de la sala anterior y suscribirse
   a la nueva.
