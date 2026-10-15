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
- Iconos PWA y caché sin conexión tras la primera carga.

## Límites de esta demo
Los comercios, ofertas y precios precargados son ficticios. Inventario, movimientos y reservas se guardan solo en ese navegador/dispositivo. No hay cuentas de empleado, sincronización entre dispositivos, notificación a comercios, ventas reales, pagos ni cobros de comisión. No uses datos reales hasta conectar y probar una base de datos compartida y un proceso de respaldo.

## Modelo posible
Comenzar con un grupo pequeño de comercios; probar el control de stock y la recolección en local. Más adelante, evaluar una suscripción económica por inventario y/o una comisión transparente por oferta recogida. No se garantiza ingreso hasta validar que los comercios y clientes la usan.
