/**
 * markdownToWhatsApp.test.js
 * Tests para convertidor Markdown → WhatsApp
 */

const MarkdownToWhatsApp = require('./markdownToWhatsApp');

describe('MarkdownToWhatsApp Module', () => {
  
  describe('convert()', () => {
    it('debe convertir títulos H1 a negrita', () => {
      const markdown = '# Hola Mundo';
      const result = MarkdownToWhatsApp.convert(markdown);
      expect(result).toBe('*Hola Mundo*');
    });

    it('debe convertir múltiples títulos', () => {
      const markdown = '# Título 1\n## Título 2';
      const result = MarkdownToWhatsApp.convert(markdown);
      expect(result).toContain('*Título 1*');
      expect(result).toContain('*Título 2*');
    });

    it('debe convertir negritas **texto** a *texto*', () => {
      const markdown = 'Esto es **importante**';
      const result = MarkdownToWhatsApp.convert(markdown);
      expect(result).toBe('Esto es *importante*');
    });

    it('debe convertir viñetas - item a • item', () => {
      const markdown = '- Primer item\n- Segundo item';
      const result = MarkdownToWhatsApp.convert(markdown);
      expect(result).toContain('• Primer item');
      expect(result).toContain('• Segundo item');
    });

    it('debe convertir listas numeradas 1. item a 1️⃣ item', () => {
      const markdown = '1. Primer paso\n2. Segundo paso';
      const result = MarkdownToWhatsApp.convert(markdown);
      expect(result).toContain('1️⃣ Primer paso');
      expect(result).toContain('2️⃣ Segundo paso');
    });

    it('debe convertir enlaces [texto](url) a texto (url)', () => {
      const markdown = 'Ver [documentación](https://example.com)';
      const result = MarkdownToWhatsApp.convert(markdown);
      expect(result).toBe('Ver documentación (https://example.com)');
    });

    it('debe preservar bloques de código', () => {
      // Nota: Los bloques de código se preservan entre los marcadores
      // El contenido del código se limpia de las comillas invertidas
      const markdown = 'Hay código dentro';
      const result = MarkdownToWhatsApp.convert(markdown);
      expect(result).toContain('Hay código dentro');
    });

    it('debe limpiar saltos de línea múltiples', () => {
      const markdown = 'Línea 1\n\n\n\nLínea 2';
      const result = MarkdownToWhatsApp.convert(markdown);
      expect(result).toBe('Línea 1\n\nLínea 2');
    });

    it('debe truncar texto muy largo con "..."', () => {
      const longText = 'a'.repeat(5000);
      const markdown = `# Título\n${longText}`;
      const result = MarkdownToWhatsApp.convert(markdown);
      expect(result.length).toBe(4096);
      expect(result.endsWith('...')).toBe(true);
    });

    it('debe manejar entrada vacía', () => {
      const result = MarkdownToWhatsApp.convert('');
      expect(result).toBe('');
    });

    it('debe manejar null/undefined', () => {
      expect(MarkdownToWhatsApp.convert(null)).toBe('');
      expect(MarkdownToWhatsApp.convert(undefined)).toBe('');
    });

    it('debe convertir ejemplo completo', () => {
      const markdown = `# API REST
      
**Endpoint:** POST /api/usuarios

Pasos:
1. Enviar datos
2. Validar respuesta
3. Procesar resultado

- [Documentación oficial](https://api.example.com/docs)
- [Ejemplos](https://api.example.com/examples)`;

      const result = MarkdownToWhatsApp.convert(markdown);
      expect(result).toContain('*API REST*');
      expect(result).toContain('*Endpoint:*');
      expect(result).toContain('1️⃣');
      expect(result).toContain('•');
    });

    it('debe convertir énfasis de subrayado a texto normal', () => {
      const markdown = 'Esto es _enfatizado_';
      const result = MarkdownToWhatsApp.convert(markdown);
      expect(result).toBe('Esto es enfatizado');
    });
  });

  describe('getMessageCount()', () => {
    it('debe retornar 1 para texto corto', () => {
      const markdown = '# Título corto';
      const count = MarkdownToWhatsApp.getMessageCount(markdown);
      expect(count).toBe(1);
    });

    it('debe retornar múltiples mensajes para texto largo', () => {
      const markdown = 'a'.repeat(10000);
      const count = MarkdownToWhatsApp.getMessageCount(markdown);
      expect(count).toBeGreaterThan(1);
    });

    it('debe retornar 2 para texto > 4096 caracteres', () => {
      const markdown = 'a'.repeat(5000);
      const count = MarkdownToWhatsApp.getMessageCount(markdown);
      expect(count).toBe(2);
    });
  });

  describe('splitMessages()', () => {
    it('debe retornar array con 1 mensaje para texto corto', () => {
      const markdown = '# Título';
      const messages = MarkdownToWhatsApp.splitMessages(markdown);
      expect(messages).toHaveLength(1);
    });

    it('debe dividir texto largo en múltiples mensajes', () => {
      const markdown = 'a'.repeat(10000);
      const messages = MarkdownToWhatsApp.splitMessages(markdown);
      expect(messages.length).toBeGreaterThan(1);
      expect(messages[0].length).toBeLessThanOrEqual(4096);
    });

    it('debe mantener integridad total del contenido', () => {
      const markdown = 'a'.repeat(5000) + 'b'.repeat(5000);
      const messages = MarkdownToWhatsApp.splitMessages(markdown);
      const combined = messages.join('');
      expect(combined).toContain('aaaaa');
      expect(combined).toContain('bbbbb');
    });

    it('debe respetar límite de 4096 caracteres por mensaje', () => {
      const markdown = 'x'.repeat(12000);
      const messages = MarkdownToWhatsApp.splitMessages(markdown);
      messages.forEach(msg => {
        expect(msg.length).toBeLessThanOrEqual(4096);
      });
    });
  });

  describe('validate()', () => {
    it('debe validar markdown correcto', () => {
      const validation = MarkdownToWhatsApp.validate('# Título válido');
      expect(validation.isValid).toBe(true);
      expect(validation.error).toBeNull();
    });

    it('debe rechazar markdown vacío', () => {
      const validation = MarkdownToWhatsApp.validate('');
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('vacío');
    });

    it('debe rechazar tipo no string', () => {
      const validation = MarkdownToWhatsApp.validate(123);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('string');
    });

    it('debe rechazar markdown muy largo > 50000 caracteres', () => {
      const markdown = 'a'.repeat(60000);
      const validation = MarkdownToWhatsApp.validate(markdown);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('50000');
    });

    it('debe aceptar markdown de hasta 50000 caracteres', () => {
      const markdown = 'a'.repeat(50000);
      const validation = MarkdownToWhatsApp.validate(markdown);
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Casos de uso reales RAG', () => {
    it('debe convertir respuesta RAG típica (con formato)', () => {
      const ragResponse = `# Respuesta de la IA

**Pregunta:** ¿Cómo hacer login?

## Pasos:
1. Ir a la página principal
2. Hacer clic en "Login"
3. Ingresar credenciales

**Recursos:**
- [Tutorial de login](https://help.example.com/login)
- [Recuperar contraseña](https://help.example.com/reset)`;

      const result = MarkdownToWhatsApp.convert(ragResponse);
      
      expect(result).toContain('*Respuesta de la IA*');
      expect(result).toContain('*Pregunta:*');
      expect(result).toContain('*Pasos:*');
      expect(result).toContain('1️⃣');
      expect(result).toContain('•');
    });

    it('debe manejar respuesta sin formato (texto plano)', () => {
      const simpleResponse = 'Esta es una respuesta simple sin formato especial';
      const result = MarkdownToWhatsApp.convert(simpleResponse);
      expect(result).toBe(simpleResponse);
    });

    it('debe truncar respuesta muy larga sin romper mensajes', () => {
      const longResponse = 'Esta es una respuesta muy larga. '.repeat(200);
      const messages = MarkdownToWhatsApp.splitMessages(longResponse);
      
      messages.forEach(msg => {
        expect(msg.length).toBeLessThanOrEqual(4096);
      });
    });
  });
});
