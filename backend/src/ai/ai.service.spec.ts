import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MockAiProvider } from './providers/mock-ai.provider';
import { OpenAiProvider } from './providers/openai.provider';

describe('MockAiProvider', () => {
  let provider: MockAiProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MockAiProvider],
    }).compile();

    provider = module.get<MockAiProvider>(MockAiProvider);
  });

  it('debe estar siempre disponible', () => {
    expect(provider.isAvailable()).toBe(true);
  });

  it('debe responder al saludo', async () => {
    const response = await provider.chat([{ role: 'user', content: 'Hola' }]);
    expect(response.content).toContain('Hola');
    expect(response.content).toContain('Atlas');
  });

  it('debe invocar herramienta searchProducts para búsqueda de camiseta', async () => {
    const response = await provider.chat([
      { role: 'user', content: 'quiero ver camisetas' },
    ]);
    expect(response.toolCalls).toBeDefined();
    expect(response.toolCalls![0].name).toBe('searchProducts');
    expect(response.toolCalls![0].arguments.query).toContain('camiseta');
  });

  it('debe invocar herramienta handoffToHuman cuando piden asesor', async () => {
    const response = await provider.chat([
      { role: 'user', content: 'quiero hablar con un asesor' },
    ]);
    expect(response.toolCalls).toBeDefined();
    expect(response.toolCalls![0].name).toBe('handoffToHuman');
  });

  it('debe invocar herramienta getCart cuando piden carrito', async () => {
    const response = await provider.chat([
      { role: 'user', content: 'qué tengo en mi carrito?' },
    ]);
    expect(response.toolCalls).toBeDefined();
    expect(response.toolCalls![0].name).toBe('getCart');
  });

  it('debe invocar herramienta createOrder cuando confirman compra', async () => {
    const response = await provider.chat([
      { role: 'user', content: 'quiero comprar' },
    ]);
    expect(response.toolCalls).toBeDefined();
    expect(response.toolCalls![0].name).toBe('createOrder');
  });

  it('debe invocar herramienta getOrderStatus para consultar pedido', async () => {
    const response = await provider.chat([
      { role: 'user', content: 'cuál es el estado de mi pedido?' },
    ]);
    expect(response.toolCalls).toBeDefined();
    expect(response.toolCalls![0].name).toBe('getOrderStatus');
  });

  it('debe invocar herramienta getCompanyInformation para horarios', async () => {
    const response = await provider.chat([
      { role: 'user', content: 'cuáles son los horarios?' },
    ]);
    expect(response.toolCalls).toBeDefined();
    expect(response.toolCalls![0].name).toBe('getCompanyInformation');
  });

  it('NO debe inventar precios en su respuesta directa', async () => {
    const response = await provider.chat([
      { role: 'user', content: 'cuánto cuesta la camiseta?' },
    ]);
    // Si da precio directo (sin herramienta), debe pedir que especifiquen el producto
    // Si invoca herramienta, está consultando la BD
    const givesDirectPrice = response.content.match(/\$\d+/);
    const invokesTool = (response.toolCalls?.length ?? 0) > 0;
    // No debe dar precio inventado SIN invocar herramienta
    expect(!givesDirectPrice || invokesTool).toBe(true);
  });
});

describe('OpenAiProvider', () => {
  let provider: OpenAiProvider;

  it('debe estar NO disponible sin API key', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenAiProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(null), // sin API key
          },
        },
      ],
    }).compile();

    provider = module.get<OpenAiProvider>(OpenAiProvider);
    expect(provider.isAvailable()).toBe(false);
  });

  it('debe estar disponible con API key configurada', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenAiProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'OPENAI_API_KEY') return 'sk-test-fake-key';
              if (key === 'OPENAI_MODEL') return 'gpt-4o-mini';
              return null;
            }),
          },
        },
      ],
    }).compile();

    provider = module.get<OpenAiProvider>(OpenAiProvider);
    expect(provider.isAvailable()).toBe(true);
  });
});
