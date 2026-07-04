---
name: code-review-before-change
description: >
  Revisión cuidadosa antes de proponer cualquier cambio de código. Usar SIEMPRE que el usuario pida modificar,
  refactorizar, corregir, agregar o eliminar cualquier parte del código, sin importar el tamaño del cambio.
  Esto incluye: fix de bugs, nuevas features, refactors, cambios de configuración, edición de tests, o cualquier
  modificación a archivos del proyecto. No omitir este proceso aunque el cambio parezca trivial.
---

# Code Review Before Change

Antes de proponer o aplicar cualquier cambio de código, seguí este proceso en orden. No saltear ningún paso.

## Proceso obligatorio

### Paso 1 — Primera lectura del código afectado
Lee el código que se va a modificar completo. Entendé qué hace actualmente, cómo está estructurado y cuál es su responsabilidad dentro del sistema.

### Paso 2 — Segunda lectura: revisión crítica
Volvé a leer el mismo código con ojo crítico. Buscá:
- Dependencias internas (funciones, clases, variables que este código usa o exporta)
- Efectos secundarios posibles
- Casos borde o lógica implícita que podría romperse

### Paso 3 — Análisis de impacto en el contexto general
Antes de tocar nada, evaluá el impacto del cambio en el proyecto:
- **Archivos afectados**: ¿qué otros archivos importan o dependen de lo que vas a cambiar?
- **Arquitectura**: ¿el cambio es coherente con los patrones del proyecto (estructura de carpetas, naming conventions, separación de responsabilidades)?
- **Tests**: ¿hay tests existentes que podrían romperse? ¿el cambio requiere nuevos tests?
- **Contratos**: ¿cambia alguna interfaz, tipo, firma de función o API que otros módulos consumen?
- **Duplicación y código muerto**: ¿el cambio duplica lógica que ya existe en otro archivo o capa? ¿deja imports, funciones, variables, o archivos sin usar? Señalá cualquier duplicación o código muerto que detectes en el área que estás tocando, aunque no sea parte directa de lo que te pidieron.
- **Arquitectura limpia**: ¿el cambio respeta la separación de capas/responsabilidades del proyecto (ej. domain no depende de infra, controllers no contienen lógica de negocio)? No agregues código espagueti: evitá anidamiento excesivo, funciones que hacen demasiadas cosas, o lógica de negocio filtrada entre capas. Si hace falta una excepción puntual, resolvé la causa raíz en la capa correcta en vez de parchar.

### Paso 4 — Explicación breve antes de aplicar
Antes de mostrar o aplicar el código nuevo, presentá un resumen técnico breve con este formato:

```
📋 Resumen del cambio
• Qué se modifica: [descripción corta]
• Archivos impactados: [lista]
• Riesgo de regresión: [bajo / medio / alto] — [motivo]
• Cambios en contratos/interfaces: [sí/no — detalle si aplica]
• Tests a actualizar: [sí/no — cuáles si aplica]
```

Luego de mostrar este resumen, presentá el código propuesto o pedí confirmación antes de aplicarlo.

## Tono y estilo
- Lenguaje técnico pero directo, sin relleno
- Si el impacto es bajo y claro, el resumen puede ser muy corto
- Si detectás algo riesgoso o ambiguo, mencionarlo explícitamente antes de proceder
