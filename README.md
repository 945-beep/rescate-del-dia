# Rescate del Día — inventario + ofertas (prototipo)

PWA de prueba para que un comercio registre sus productos y use existencias para crear ofertas de excedentes en Atlacomulco.

## Incluye
- Sección de ofertas con búsqueda y filtros.
- Inventario con alta y baja de productos, existencia inicial, umbral mínimo y vencimiento.
- Movimientos de entrada, salida/venta y conteo físico.
- Alertas de bajo stock y productos vencidos o por vencer.
- Ofertas ligadas al inventario. Las reservas simuladas descuentan la existencia de la oferta y del producto; las unidades comprometidas no se pueden volver a ofrecer ni retirar por error.
- Cancelar una oferta libera su asignación; un producto con ofertas activas no se puede borrar.
- Exportar respaldo JSON, eliminar productos sin ofertas activas y reiniciar los datos locales con confirmación.
- Inicio de sesión y creación de cuenta con Supabase Auth; el acceso al inventario requiere cuenta.

## Límites de esta demo
Los comercios, ofertas y precios precargados son ficticios. Hay inicio de sesión, pero inventario, movimientos, ofertas propias y reservas siguen guardándose solo en ese navegador y se separan por cuenta; todavía no se sincronizan entre dispositivos ni existe una base compartida para esos datos. No hay notificación a comercios, ventas reales, pagos ni cobros de comisión. No uses datos reales hasta completar y probar la sincronización segura y el respaldo.

## Modelo posible
Comenzar con un grupo pequeño de comercios; probar el control de stock y la recolección en local. Más adelante, evaluar una suscripción económica por inventario y/o una comisión transparente por oferta recogida. No se garantiza ingreso hasta validar que los comercios y clientes la usan.
