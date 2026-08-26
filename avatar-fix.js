function avatarHTML(c, size) {
  var s = size || 40;
  var name = (c && c.name) ? String(c.name) : '';
  var initialsText = (c && c.initials) ? c.initials : '?';
  var bg = (c && c.color) ? c.color : '#333';
  var fg = (c && c.text) ? c.text : '#fff';
  var initials = '<div style="width:' + s + 'px;height:' + s + 'px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:' + (s < 40 ? 10 : 12) + 'px;flex-shrink:0;border:2px solid #c9a22733;background:' + bg + ';color:' + fg + '">' + initialsText + '</div>';
  var portrait = (typeof CHAMPION_PORTRAITS !== 'undefined' && c && c.id && CHAMPION_PORTRAITS[c.id]) ? CHAMPION_PORTRAITS[c.id] : null;
  if (!portrait) return initials;
  return '<img src="data:image/jpeg;base64,' + portrait + '" alt="" width="' + s + '" height="' + s + '" style="width:' + s + 'px;height:' + s + 'px;border-radius:9999px;object-fit:cover;flex-shrink:0;border:2px solid #c9a22766;background:#1a1a20" onerror="this.outerHTML=this.getAttribute(\'data-fb\')" data-fb="' + initials.replace(/"/g, '&quot;') + '" />';
}
