---
layout: null
---
{%- comment -%} Site search entries for assets/main.js: pages by hand, apps from _data/apps.yml. {%- endcomment -%}
window.SITE_INDEX = [
  { "title": "Home", "description": "Icenux — software with a cool edge", "url": "/", "type": "Page", "group": "Pages", "icon": "home" },
  { "title": "What it’s about", "description": "Terminal tools, light on the system, installable and verifiable", "url": "/#what-we-do", "type": "Section", "group": "Pages", "icon": "sparkle" },
  { "title": "Apps", "description": "{% for app in site.data.apps %}{{ app.name }}{% unless forloop.last %}, {% endunless %}{% endfor %} — the Icenux lineup", "url": "/apps/", "type": "Page", "group": "Pages", "icon": "layers" }
  {%- for app in site.data.apps -%}
  {%- capture dl %}{{ app.download_desc }} ({{ app.version }}){% endcapture -%},
  { "title": {{ app.name | jsonify }}, "description": {{ app.search_desc | jsonify }}, "url": {{ app.url | jsonify }}, "type": "App", "group": "Apps", "icon": {{ app.search_icon | jsonify }} },
  { "title": {{ app.download_title | jsonify }}, "description": {{ dl | jsonify }}, "url": "{{ app.url }}#download", "type": "Download", "group": "Apps", "icon": "download" }
  {%- endfor %}
];
