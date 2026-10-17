import { BODY_MAX_LENGTH, notificationTitle, reminderBody, TITLE_MAX_LENGTH, triggerBody } from './notification.copy';

const LEAD_WIFI = 'Te desconectaste del Wi-Fi de Casa.';

describe('cuerpo de la notificación (Documento de Contenido §05)', () => {
  it('nombra hasta 4 ítems y resume el resto con "y N más"', () => {
    const labels = ['Llaves', 'Billetera', 'Celular', 'Cargador', 'Gafas', 'Estufa', 'Gas'];
    expect(triggerBody('Son las 6:00 p. m.', labels)).toBe(
      'Son las 6:00 p. m. Revisa 7 cosas: Llaves, Billetera, Celular, Cargador y 3 más',
    );
  });

  it('con 4 o menos los nombra todos', () => {
    expect(triggerBody(LEAD_WIFI, ['Llaves', 'Billetera'])).toBe(
      'Te desconectaste del Wi-Fi de Casa. Revisa 2 cosas: Llaves y Billetera',
    );
    expect(triggerBody(LEAD_WIFI, ['Llaves'])).toBe('Te desconectaste del Wi-Fi de Casa. Revisa 1 cosa: Llaves');
  });

  it('nunca pasa de 80 caracteres: nombra menos ítems si son largos', () => {
    const labels = ['Cargador portátil', 'Llaves de la casa', 'Billetera', 'Celular'];
    const body = triggerBody(LEAD_WIFI, labels);
    expect(body.length).toBeLessThanOrEqual(BODY_MAX_LENGTH);
    expect(body).toBe('Te desconectaste del Wi-Fi de Casa. Revisa 4 cosas: Cargador portátil y 3 más');
  });

  it('si ni un ítem cabe, deja solo la cantidad', () => {
    const lead = 'Te desconectaste del Wi-Fi de Apartamento del centro.';
    const body = triggerBody(lead, ['Guardar archivos en la nube', 'Otro ítem bastante largo']);
    expect(body).toBe(`${lead} Revisa 2 cosas.`);
    expect(body.length).toBeLessThanOrEqual(BODY_MAX_LENGTH);
  });

  it('recordatorio: "Aún tienes [n] cosas por revisar en [Rutina]."', () => {
    expect(reminderBody(4, 'Saliendo de casa')).toBe('Aún tienes 4 cosas por revisar en Saliendo de casa.');
  });

  it('título: el nombre de la rutina, máximo 40 caracteres', () => {
    expect(notificationTitle('Saliendo de casa')).toBe('Saliendo de casa');
    expect(notificationTitle('x'.repeat(50)).length).toBe(TITLE_MAX_LENGTH);
  });
});
