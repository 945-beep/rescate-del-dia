# Rescate del Día — inventario + ofertas (prototipo)

PWA de prueba para que un comercio registre sus productos y use existencias para crear ofertas de excedentes en Atlacomulco.

## Incluye
- Sección de ofertas con búsqueda y filtros.
- Inventario con alta y baja de productos, existencia inicial, umbral mínimo y vencimiento.
- Calculadora por producto: costo, ganancia editable e IVA configurable; muestra ganancia bruta, IVA y precio sugerido. Permite comparar con una referencia local ingresada manualmente.
- Menú de ajustes sincronizado por cuenta: negocio y zona predeterminados, ganancia e IVA por defecto; se pueden cambiar en cada producto.
- Movimientos de entrada, salida/venta y conteo físico.
- Alertas de bajo stock y productos vencidos o por vencer.
- Ofertas ligadas al inventario. Las reservas simuladas descuentan la existencia de la oferta y del producto; las unidades comprometidas no se pueden volver a ofrecer ni retirar por error.
- Cancelar una oferta libera su asignación; un producto con ofertas activas no se puede borrar.
- Exportar respaldo JSON, eliminar productos sin ofertas activas y reiniciar los datos locales con confirmación.
- Inicio de sesión y creación de cuenta con Supabase Auth; el acceso al inventario requiere cuenta.
- Sincronización privada entre dispositivos para inventario, movimientos, ofertas y reservas de la cuenta autenticada, protegida con políticas RLS.

## Límites de esta demo
Los negocios y ofertas de ejemplo son ficticios; no se muestran como comercios participantes. Los datos de la cuenta autenticada se guardan en Supabase bajo RLS y también quedan en el dispositivo. Usa la misma cuenta en cada equipo; si dos dispositivos editan a la vez, la app puede pausar la sincronización y pedir resolver el conflicto. El precio sugerido se calcula desde costo, ganancia elegida e IVA; la referencia local se captura manualmente y no es un promedio de mercado. El cálculo no incluye otros gastos ni IVA acreditable; confirma la tasa aplicable con tu contador. No hay notificación a comercios, ventas reales, pagos ni cobros de comisión. Mantén respaldos y no publiques ofertas reales sin revisión y consentimiento.

## Modelo posible
Comenzar con un grupo pequeño de comercios; probar el control de stock y la recolección en local. Más adelante, evaluar una suscripción económica por inventario y/o una comisión transparente por oferta recogida. No se garantiza ingreso hasta validar que los comercios y clientes la usan.
