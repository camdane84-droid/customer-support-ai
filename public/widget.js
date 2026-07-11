/**
 * InboxForge chat widget loader.
 *
 * Usage (paste before </body> on any website):
 *   <script src="https://YOUR-APP-DOMAIN/widget.js" data-key="YOUR-WIDGET-KEY" async></script>
 *
 * Optional attributes:
 *   data-color="#7c3aed"  — launcher button color (chat window color is set in InboxForge settings)
 */
(function () {
  var script = document.currentScript;
  if (!script) return;

  var key = script.getAttribute('data-key');
  if (!key) {
    console.warn('[InboxForge] Chat widget: missing data-key attribute');
    return;
  }

  var color = script.getAttribute('data-color') || '#7c3aed';
  var origin;
  try {
    origin = new URL(script.src).origin;
  } catch (e) {
    console.warn('[InboxForge] Chat widget: could not determine script origin');
    return;
  }

  var Z_INDEX = '2147483000';
  var isOpen = false;
  var iframe = null;

  // Launcher button
  var button = document.createElement('button');
  button.setAttribute('aria-label', 'Open chat');
  button.style.cssText =
    'position:fixed;bottom:20px;right:20px;width:56px;height:56px;border-radius:50%;' +
    'border:none;cursor:pointer;z-index:' + Z_INDEX + ';display:flex;align-items:center;' +
    'justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,0.25);transition:transform 0.15s ease;' +
    'background-color:' + color + ';padding:0;';
  button.onmouseenter = function () { button.style.transform = 'scale(1.06)'; };
  button.onmouseleave = function () { button.style.transform = 'scale(1)'; };

  var CHAT_ICON =
    '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
  var CLOSE_ICON =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  button.innerHTML = CHAT_ICON;

  function createIframe() {
    iframe = document.createElement('iframe');
    iframe.src = origin + '/widget/' + encodeURIComponent(key);
    iframe.title = 'Chat';
    iframe.style.cssText =
      'position:fixed;border:none;z-index:' + Z_INDEX + ';display:none;background:#fff;' +
      'box-shadow:0 8px 40px rgba(0,0,0,0.25);';
    document.body.appendChild(iframe);
    applyLayout();
  }

  function applyLayout() {
    if (!iframe) return;
    if (window.innerWidth <= 480) {
      // Mobile: full screen
      iframe.style.top = '0';
      iframe.style.left = '0';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.borderRadius = '0';
    } else {
      iframe.style.top = 'auto';
      iframe.style.left = 'auto';
      iframe.style.right = '20px';
      iframe.style.bottom = '88px';
      iframe.style.width = '384px';
      iframe.style.height = Math.min(640, window.innerHeight - 110) + 'px';
      iframe.style.borderRadius = '16px';
    }
  }

  function setOpen(open) {
    isOpen = open;
    if (open && !iframe) createIframe();
    if (iframe) iframe.style.display = open ? 'block' : 'none';
    button.innerHTML = open ? CLOSE_ICON : CHAT_ICON;
    button.setAttribute('aria-label', open ? 'Close chat' : 'Open chat');
  }

  button.onclick = function () { setOpen(!isOpen); };

  window.addEventListener('resize', applyLayout);
  window.addEventListener('message', function (event) {
    if (event.origin !== origin) return;
    if (event.data && event.data.type === 'inboxforge:close') setOpen(false);
  });

  function mount() { document.body.appendChild(button); }
  if (document.body) {
    mount();
  } else {
    document.addEventListener('DOMContentLoaded', mount);
  }
})();
