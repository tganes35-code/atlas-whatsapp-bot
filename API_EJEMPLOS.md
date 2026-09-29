# 📡 API Atlas WhatsApp Chatbot - EJEMPLOS

## Base URL
```
{TU-URL}
Ejemplos:
- https://atlas-whatsapp-bot-api.herokuapp.com
- https://atlas-whatsapp-bot-xyz.railway.app
- http://localhost:3001 (local)
```

---

## 🔐 AUTENTICACIÓN

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@atlas.com",
  "password": "admin123"
}
```

**Respuesta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "email": "admin@atlas.com",
    "role": "admin"
  }
}
```

**Usar el token en request futuras:**
```bash
Authorization: Bearer {access_token}
```

---

## 💬 MENSAJES

### Procesar Mensaje (Enviar respuesta del bot)
```bash
POST /api/messages/process
Content-Type: application/json

{
  "phoneNumber": "+34666777888",
  "message": "¿Cuál es tu menú?",
  "userId": "123456"
}
```

**Respuesta:**
```json
{
  "id": "msg-123",
  "phoneNumber": "+34666777888",
  "message": "¿Cuál es tu menú?",
  "response": "Bienvenido a Atlas. Nuestro menú incluye: Pizzas, Bebidas, Postres.",
  "timestamp": "2026-09-29T10:30:00Z",
  "source": "whatsapp"
}
```

### Obtener Conversación
```bash
GET /api/messages?phoneNumber=+34666777888
Authorization: Bearer {token}
```

**Respuesta:**
```json
[
  {
    "id": "msg-1",
    "phoneNumber": "+34666777888",
    "message": "Hola",
    "response": "Hola, ¿en qué puedo ayudarte?",
    "timestamp": "2026-09-29T10:00:00Z"
  },
  {
    "id": "msg-2",
    "phoneNumber": "+34666777888",
    "message": "¿Cuál es tu menú?",
    "response": "Bienvenido a Atlas. Nuestro menú incluye...",
    "timestamp": "2026-09-29T10:30:00Z"
  }
]
```

---

## 📦 PRODUCTOS

### Obtener Todos los Productos
```bash
GET /api/products
```

**Respuesta:**
```json
[
  {
    "id": "prod-1",
    "name": "Pizza Margarita",
    "description": "Tomate, mozzarella, albahaca",
    "price": 12.99,
    "categoryId": "cat-1",
    "image": "https://...",
    "available": true
  },
  {
    "id": "prod-2",
    "name": "Pizza Pepperoni",
    "description": "Tomate, queso, pepperoni",
    "price": 14.99,
    "categoryId": "cat-1",
    "image": "https://...",
    "available": true
  }
]
```

### Obtener Producto por ID
```bash
GET /api/products/prod-1
```

### Crear Producto (Admin)
```bash
POST /api/products
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Pizza BBQ",
  "description": "Tomate, queso, pollo BBQ",
  "price": 15.99,
  "categoryId": "cat-1",
  "image": "https://example.com/pizza-bbq.jpg"
}
```

### Actualizar Producto (Admin)
```bash
PATCH /api/products/prod-1
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "price": 13.99,
  "available": true
}
```

### Eliminar Producto (Admin)
```bash
DELETE /api/products/prod-1
Authorization: Bearer {admin_token}
```

---

## 📂 CATEGORÍAS

### Obtener Todas las Categorías
```bash
GET /api/categories
```

**Respuesta:**
```json
[
  {
    "id": "cat-1",
    "name": "Pizzas",
    "description": "Nuestras deliciosas pizzas",
    "icon": "🍕"
  },
  {
    "id": "cat-2",
    "name": "Bebidas",
    "description": "Bebidas refrescantes",
    "icon": "🥤"
  }
]
```

### Crear Categoría (Admin)
```bash
POST /api/categories
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Postres",
  "description": "Postres deliciosos",
  "icon": "🍰"
}
```

---

## 🛒 CARRITOS

### Agregar Producto al Carrito
```bash
POST /api/carts/add
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": "prod-1",
  "quantity": 2,
  "customerId": "cust-123"
}
```

**Respuesta:**
```json
{
  "id": "cart-123",
  "customerId": "cust-123",
  "items": [
    {
      "productId": "prod-1",
      "name": "Pizza Margarita",
      "price": 12.99,
      "quantity": 2,
      "subtotal": 25.98
    }
  ],
  "total": 25.98
}
```

### Obtener Carrito
```bash
GET /api/carts/cust-123
Authorization: Bearer {token}
```

### Eliminar Producto del Carrito
```bash
DELETE /api/carts/items/item-123
Authorization: Bearer {token}
```

### Vaciar Carrito
```bash
DELETE /api/carts/cust-123
Authorization: Bearer {token}
```

---

## 👥 CLIENTES

### Obtener Todos los Clientes
```bash
GET /api/customers
Authorization: Bearer {admin_token}
```

### Obtener Cliente por ID
```bash
GET /api/customers/cust-123
Authorization: Bearer {token}
```

### Crear Cliente
```bash
POST /api/customers
Content-Type: application/json

{
  "phoneNumber": "+34666777888",
  "name": "Juan García",
  "email": "juan@example.com"
}
```

### Actualizar Cliente
```bash
PATCH /api/customers/cust-123
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Juan García López",
  "email": "juangarcia@example.com"
}
```

---

## 📊 DASHBOARD

### Obtener Estadísticas
```bash
GET /api/dashboard
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "stats": {
    "totalMessages": 150,
    "totalCustomers": 45,
    "totalOrders": 30,
    "totalRevenue": 1250.50,
    "activeConversations": 5,
    "responseTime": "2.3s"
  },
  "recentMessages": [
    {
      "phoneNumber": "+34666777888",
      "message": "Hola",
      "timestamp": "2026-09-29T10:30:00Z"
    }
  ],
  "topProducts": [
    {
      "name": "Pizza Margarita",
      "sold": 25
    }
  ]
}
```

---

## 🪝 WEBHOOKS

### Webhook Meta WhatsApp (Entrada)
```bash
POST /api/webhooks/whatsapp

# Meta enviará JSON como:
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "123456789",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "messages": [{
          "from": "1234567890",
          "id": "msg-123",
          "timestamp": "1234567890",
          "type": "text",
          "text": {"body": "Hola"}
        }]
      }
    }]
  }]
}
```

### Webhook Verificación Meta
```bash
GET /api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=atlas-verify-token&hub.challenge=CHALLENGE_STRING

# Tu servidor responde automáticamente con CHALLENGE_STRING
```

---

## 🤖 IA & CONVERSACIONES

### Obtener Historial de Conversación
```bash
GET /api/conversations?phoneNumber=+34666777888
Authorization: Bearer {token}
```

### Enviar Mensaje IA
```bash
POST /api/ai/message
Authorization: Bearer {token}
Content-Type: application/json

{
  "phoneNumber": "+34666777888",
  "message": "Quiero una pizza vegetariana"
}
```

**Respuesta:**
```json
{
  "response": "Tenemos dos opciones vegetarianas: Pizza Vegetariana Clásica (€11.99) y Pizza Vegana (€13.99). ¿Cuál prefieres?",
  "intent": "product_inquiry",
  "confidence": 0.95
}
```

---

## ⚙️ SISTEMA

### Health Check
```bash
GET /api/health
```

**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2026-09-29T10:30:00Z"
}
```

### Obtener Información del Sistema
```bash
GET /api/system/info
Authorization: Bearer {admin_token}
```

**Respuesta:**
```json
{
  "version": "1.0.0",
  "environment": "production",
  "database": "connected",
  "ai_provider": "openai",
  "uptime": 3600,
  "requestsPerMinute": 45
}
```

---

## 📝 CÓDIGOS DE ESTADO

| Código | Significado |
|--------|-------------|
| 200 | OK - Éxito |
| 201 | Created - Recurso creado |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - Token inválido/expirado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no existe |
| 500 | Server Error - Error del servidor |

---

## 🔑 CREDENCIALES DE PRUEBA

**Admin:**
```
Email: admin@atlas.com
Password: admin123
```

**Usar en login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@atlas.com",
    "password": "admin123"
  }'
```

---

## 💡 EJEMPLOS PRÁCTICOS

### 1. Crear un producto y obtener su ID
```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@atlas.com","password":"admin123"}' \
  | jq -r '.access_token')

# 2. Crear producto
curl -X POST http://localhost:3001/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pizza Especial",
    "description": "La mejor pizza",
    "price": 16.99,
    "categoryId": "cat-1"
  }'
```

### 2. Procesar mensaje del cliente
```bash
curl -X POST http://localhost:3001/api/messages/process \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+34666777888",
    "message": "¿Cuál es tu pizza más popular?",
    "userId": "user-123"
  }' \
  | jq '.'
```

### 3. Obtener dashboard
```bash
curl http://localhost:3001/api/dashboard \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'
```

---

**¿Necesitas más ejemplos?** Revisa:
- CHATBOT_SETUP_COMPLETO.md
- Código fuente en `backend/src/`
