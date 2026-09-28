(function () {
  'use strict';

  var CFG = window.EG_CHATBOT_CONFIG || {};
  var LOGO_URL = CFG.logoUrl || '/themes/YOUR_THEME/assets/img/chatbot/logo.png';
  var AGENT_URL = CFG.agentUrl || '/themes/YOUR_THEME/assets/img/chatbot/agente-de-soporte.png';

  var faqCategories = [
    { id: 'despacho', label: 'Despacho', emoji: '🚚' },
    { id: 'contacto', label: 'Contacto', emoji: '📱' },
    { id: 'cotizacion', label: 'Cotización', emoji: '🧾' },
    { id: 'otro', label: 'Otro', emoji: '❓' }
  ];

  var faqData = [
    {
      id: 'faq-1',
      question: 'Quisiera saber sobre mi despacho',
      answer: 'Si compró y quiere saber sobre su pedido, le pido que por favor nos mande un correo a servicio alcliente@guzman.cl.',
      category: 'despacho',
      active: true
    },
    {
      id: 'faq-2',
      question: '¿Tienen algún Whatsapp?',
      answer: 'Sí, nos puede escribir al +56965413810.\nNuestros horarios son de lunes a jueves de 9:00 a 18:00 y viernes hasta las 15:30 (Excepto festivos o similares).',
      category: 'contacto',
      active: true
    },
    {
      id: 'faq-3',
      question: '¿Puedo enviar algún listado o archivo en Excel o Word para cotizar?',
      answer: 'Claro, nos puede enviar su listado archivo por este medio o ventaweb@guzman.cl.',
      category: 'cotizacion',
      active: true
    },
    {
      id: 'faq-4',
      question: '¿Cuáles son sus horarios de atención?',
      answer: 'Atendemos de lunes a jueves de 9:00 a 17:30 y viernes hasta las 15:00 horas (excepto festivos o con previo aviso por medio de nuestra web y redes sociales).',
      category: 'otro',
      active: true
    },
    {
      id: 'faq-5',
      question: '¿Tienen un programa de fidelización o recompensas?',
      answer: 'Actualmente no contamos con un programa de fidelización, pero te invitamos a estar atento a nuestras promociones y ofertas especiales que publicamos regularmente en https://guzman.cl/outlet',
      category: 'otro',
      active: true
    },
    {
      id: 'faq-7',
      question: '¿Puedo realizar una cotización de productos?',
      answer: 'Sí, puedes realizar una cotización de productos a través de nuestra plataforma. Simplemente busca el producto deseado añade el productos a tu cotización y sigue las instrucciones en la sección de cotizaciones.',
      category: 'cotizacion',
      active: true
    },
    {
      id: 'faq-8',
      question: '¿Tienen algún tipo de garantía en sus productos?',
      answer: 'Sí, todos nuestros productos cuentan con garantía. Para más información sobre las condiciones de garantía, puedes consultar la sección correspondiente en nuestro sitio web.',
      category: 'otro',
      active: true
    },
    {
      id: 'faq-9',
      question: '¿Cómo puedo contactar a Electricidad Guzman?',
      answer: 'Puedes contactarnos llamando al (+56) 22 387 1111 o enviando un correo a contacto@guzman.cl.',
      category: 'contacto',
      active: true
    },
    {
      id: 'faq-10',
      question: '¿Ofrecen despacho a domicilio?',
      answer: 'Sí, ofrecemos despacho a todo Chile. Además, si tu compra supera los $80.000, el despacho es gratis en la Región Metropolitana Urbana y gratis en la Región Metropolitana Rural para compras sobre $120.000.',
      category: 'despacho',
      active: true
    },
    {
      id: 'faq-11',
      question: '¿Cómo puedo realizar una compra en línea?',
      answer: 'Para realizar una compra en línea, simplemente navega por nuestras categorías, selecciona los productos que deseas y agrégales a tu carrito. Luego, sigue el proceso de pago en nuestro sitio web.',
      category: 'otro',
      active: true
    },
    {
      id: 'faq-12',
      question: '¿Qué tipos de productos ofrece Electricidad Guzman?',
      answer: 'Ofrecemos una amplia gama de productos en categorías como conductores, iluminación, canalización, residencial, protecciones, ferretería eléctrica, control y comando, conectividad y redes y mucho más. Puedes ver todas nuestras categorías en nuestro sitio web.',
      category: 'otro',
      active: true
    },
    {
      id: 'faq-13',
      question: '¿Cuánto me cobrarán por mi despacho?',
      answer: 'Regiones y otras zonas: El costo se calcula automáticamente en el carrito de compras en guzman.cl o vía correo con la dirección y  la lista de materiales a ventaweb@guzman.cl ya que se necesita dimensionar.',
      category: 'despacho',
      active: true
    },
    {
      id: 'faq-14',
      question: '¿Con qué empresas trabajan para despachar?',
      answer: 'Para regiones trabajamos con starken y PDQ. Para despachos dentro de la Región Metropolitana contamos con despacho propio.',
      category: 'despacho',
      active: true
    },
    {
      id: 'faq-15',
      question: '¿Si compro hoy, cuándo llegará mi pedido?',
      answer: 'Si compra antes de las 12:00 horas, su pedido se despacha el día siguiente.',
      category: 'despacho',
      active: true
    }
  ];

  var state = {
    isOpen: false,
    isTyping: false,
    messages: []
  };

  function greetingText() {
    var hour = new Date().getHours();
    var saludo = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';
    return '¡' + saludo + '! 👋 Soy el asistente de Electricidad Guzman. Elige una opción para ayudarte:';
  }

  function categoryOptions() {
    return faqCategories.map(function (c) {
      return { id: c.id, label: c.emoji + '  ' + c.label, action: 'category' };
    });
  }

  function questionOptions(categoryId) {
    var options = faqData
      .filter(function (f) { return f.active && f.category === categoryId; })
      .map(function (f) { return { id: f.id, label: f.question, action: 'faq' }; });
    options.push({ id: 'back', label: '◀ Volver a opciones principales', action: 'back' });
    return options;
  }

  function buildInitialMessages() {
    return [
      { id: 'welcome-text', sender: 'bot', text: greetingText() },
      { id: 'welcome-options', sender: 'bot', options: categoryOptions() }
    ];
  }

  state.messages = buildInitialMessages();

  function selectOption(option) {
    var now = Date.now();

    if (option.action === 'category') {
      state.messages.push({ id: 'u-' + now, sender: 'user', text: option.label });
    } else if (option.action === 'faq') {
      var faq = faqData.filter(function (f) { return f.id === option.id; })[0];
      if (!faq) return;
      state.messages.push({ id: 'u-' + now, sender: 'user', text: faq.question });
    } else if (option.action === 'back') {
      state.messages.push({ id: 'u-' + now, sender: 'user', text: 'Volver' });
    }

    state.isTyping = true;
    render();

    setTimeout(function () {
      if (option.action === 'category') {
        state.messages.push({ id: 'b-' + (now + 1), sender: 'bot', options: questionOptions(option.id) });
      } else if (option.action === 'faq') {
        var faq = faqData.filter(function (f) { return f.id === option.id; })[0];
        if (faq) {
          state.messages.push({ id: 'b-' + (now + 1), sender: 'bot', text: faq.answer });
          state.messages.push({ id: 'b-' + (now + 2), sender: 'bot', options: questionOptions(faq.category) });
        }
      } else if (option.action === 'back') {
        state.messages.push({ id: 'b-' + (now + 1), sender: 'bot', options: categoryOptions() });
      }
      state.isTyping = false;
      render();
    }, 800);
  }

  function resetChat() {
    state.messages = buildInitialMessages();
    state.isTyping = false;
    render();
  }

  /* FORMATEO DE TEXTO Detecta URLs, emails y teléfonos y los vuelve clicables */
  var COMBINED_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|(?:\+\d{1,3}\s?)?\d{8,11})/g;
  var EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  var URL_RE = /^(https?:\/\/[^\s]+|www\.[^\s]+)$/;
  var PHONE_RE = /^(\+?\d[\d\s-]{7,})$/;

  function appendFormattedText(container, text) {
    var parts = text.split(COMBINED_REGEX);
    parts.forEach(function (part) {
      if (!part) return;
      var trimmed = part.trim();
      if (EMAIL_RE.test(part)) {
        var a = document.createElement('a');
        a.href = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(part);
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = part;
        container.appendChild(a);
      } else if (URL_RE.test(part)) {
        var url = part.startsWith('www.') ? 'https://' + part : part;
        var a2 = document.createElement('a');
        a2.href = url;
        a2.target = '_blank';
        a2.rel = 'noopener noreferrer';
        a2.textContent = part;
        container.appendChild(a2);
      } else if (PHONE_RE.test(trimmed)) {
        var clean = trimmed.replace(/\s+/g, '');
        var a3 = document.createElement('a');
        a3.href = 'tel:' + clean;
        a3.textContent = part;
        container.appendChild(a3);
      } else {
        container.appendChild(document.createTextNode(part));
      }
    });
  }

  /* RENDER (DOM) */
  var els = {};

  function buildSkeleton() {
    var button = document.createElement('button');
    button.id = 'eg-chatbot-button';
    button.type = 'button';
    button.setAttribute('aria-label', 'Abrir asistente virtual');
    var btnImg = document.createElement('img');
    btnImg.src = LOGO_URL;
    btnImg.alt = 'Electricidad Guzman';
    button.appendChild(btnImg);

    var overlay = document.createElement('div');
    overlay.id = 'eg-chatbot-overlay';

    var panel = document.createElement('div');
    panel.id = 'eg-chatbot-panel';

    var header = document.createElement('div');
    header.id = 'eg-chatbot-header';
    var title = document.createElement('span');
    title.className = 'eg-title';
    title.textContent = 'Asistente Electricidad Guzman';
    var closeBtn = document.createElement('button');
    closeBtn.id = 'eg-chatbot-close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Cerrar asistente');
    closeBtn.textContent = '✕';
    header.appendChild(title);
    header.appendChild(closeBtn);

    var scroll = document.createElement('div');
    scroll.id = 'eg-chatbot-scroll';

    panel.appendChild(header);
    panel.appendChild(scroll);
    overlay.appendChild(panel);

    document.body.appendChild(button);
    document.body.appendChild(overlay);

    els.button = button;
    els.overlay = overlay;
    els.panel = panel;
    els.closeBtn = closeBtn;
    els.scroll = scroll;

    button.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
    panel.addEventListener('click', function (e) { e.stopPropagation(); });
  }

  function createAvatar() {
    var av = document.createElement('div');
    av.className = 'eg-avatar';
    var img = document.createElement('img');
    img.src = AGENT_URL;
    img.alt = 'Agente';
    av.appendChild(img);
    return av;
  }

  function renderMessage(message) {
    var isBot = message.sender === 'bot';
    var row = document.createElement('div');
    row.className = 'eg-row ' + (isBot ? 'eg-bot' : 'eg-user');

    if (isBot) row.appendChild(createAvatar());

    if (message.options) {
      var optionsWrap = document.createElement('div');
      optionsWrap.className = 'eg-options';
      message.options.forEach(function (opt) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'eg-option-btn';
        btn.textContent = opt.label;
        btn.addEventListener('click', function () { selectOption(opt); });
        optionsWrap.appendChild(btn);
      });
      row.appendChild(optionsWrap);
    } else {
      var bubble = document.createElement('div');
      bubble.className = 'eg-bubble-text ' + (isBot ? 'eg-bot' : 'eg-user');
      appendFormattedText(bubble, message.text || '');
      row.appendChild(bubble);
    }

    return row;
  }

  function renderTyping() {
    var row = document.createElement('div');
    row.className = 'eg-row eg-bot';
    row.appendChild(createAvatar());
    var bubble = document.createElement('div');
    bubble.className = 'eg-typing';
    var span = document.createElement('span');
    span.textContent = 'Escribiendo...';
    bubble.appendChild(span);
    row.appendChild(bubble);
    return row;
  }

  function render() {
    els.scroll.innerHTML = '';
    state.messages.forEach(function (m) {
      els.scroll.appendChild(renderMessage(m));
    });
    if (state.isTyping) {
      els.scroll.appendChild(renderTyping());
    }
    els.scroll.scrollTop = els.scroll.scrollHeight;
  }

  function open() {
    state.isOpen = true;
    els.overlay.classList.add('eg-open');
    setTimeout(function () { els.scroll.scrollTop = els.scroll.scrollHeight; }, 100);
  }

  function close() {
    state.isOpen = false;
    els.overlay.classList.remove('eg-open');
  }

  /* INIT */
  function init() {
    buildSkeleton();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expuesto por si necesitas resetear el chat desde otro script
  window.EGChatbot = { open: open, close: close, reset: resetChat };
})();
