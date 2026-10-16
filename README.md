# Rescate del Día — inventario + catálogo piloto

PWA para que un comercio controle existencias y, si lo desea, envíe productos seleccionados al catálogo público CercaCerca.

## Incluye
- Inventario privado por negocio, movimientos de entrada, salida/venta y conteo físico.
- Perfiles separados, sincronización privada con Supabase Auth y RLS.
- Calculadora de precio, margen, IVA y referencia local.
- Publicación individual y opcional al catálogo CercaCerca, con consentimiento explícito de los datos públicos. Cada solicitud queda pendiente; la aprobación solo la puede realizar administración.
- WhatsApp configurable por negocio y vacío por defecto.
- Al cambiar existencias, el catálogo se actualiza con el saldo menos unidades comprometidas por ofertas activas; una existencia pública de cero deja de mostrarse.
- Retirar del catálogo no borra el producto del inventario privado.

## Flujo piloto
La persona interesada contacta por WhatsApp. El comercio confirma manualmente la disponibilidad y, si vende, registra «Salida / venta» en Rescate del Día. No se procesan pedidos, pagos, checkout ni apartados automáticos. Las ofertas/reservas de demostración son independientes de la compra por catálogo.

## Configuración
Ambas apps comparten el proyecto Supabase. Antes de probar la publicación, instala una vez `cercacerca-app/supabase/catalog-products.sql` y confirma que `catalog_products` esté disponible. Mantén las reglas RLS de `rescate_state` intactas y nunca uses una clave `service_role` en el navegador.


## Catálogo CercaCerca
La venta de productos se activa por negocio y está desactivada por defecto. Los perfiles de servicios, incluido Autolavado, no pueden publicar productos. Aun con la designación activada, cada producto requiere consentimiento explícito y aprobación administrativa.
