// Guion de BIT. Lo usan la web (subtítulos y voz) y `python3 invitacion.py voces` (genera los audios).
// Variables: {first} nombre, {saludo} Querido/Querida, {msg} mensaje personal, {where} lugar.
// Si cambias un texto, vuelve a correr `python3 invitacion.py voces`.
window.NARR = {
  "intro": "¡Hola! Soy BIT, el agente robot de Diego. Estoy verificando tus credenciales, {first}.",
  "intro_lookup": "¡Hola! Soy BIT, el agente robot de Diego. No encuentro tus credenciales. Escribe tu nombre.",
  "granted": "Acceso concedido. {first}, Diego te dejó una carta muy especial.",
  "found": "Te encontré, {first}. Diego te dejó una carta muy especial.",
  "seal": "Toca el sello rojo para abrir tu carta.",
  "opening": "¡Abriendo!",
  "hi": "{saludo} {first}. Diego quiere decirte algo.",
  "msg": "{msg} Te invito a mi cena de grado como Ingeniero de Sistemas. Será un honor compartir este momento contigo.",
  "date": "La cena es el martes veintisiete de octubre, a las siete de la noche. {where} Confirma tu asistencia con el botón de abajo.",
  "yes": "¡Genial, {first}! Asistencia confirmada. Diego te espera el martes. ¡Felicitaciones al nuevo ingeniero!",
  "no": "Entendido, {first}. Diego te manda un abrazo enorme."
};
