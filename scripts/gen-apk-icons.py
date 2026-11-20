import glob, re, os, json, sys
SRC = '_apk-analysis-v5/resources/res/drawable'
SKIP = re.compile(r'^(ic_(call_|m3_|mtrl_|onboarding|password_changed|confirmation|email_sent|support_(empty|success)|map_|wallet_arinpark|logo_|dial|stat|expand_|time_|wallet_add_card|wallet_active|wallet_inactive|ticket_|faq|marker|car_none|arrow_forward|clear_black|keyboard|clock_black))')
out = {}
for f in sorted(glob.glob(SRC + '/ic_*.xml')):
    name = os.path.basename(f)[:-4]
    if SKIP.match(name): continue
    s = open(f, encoding='utf-8').read()
    if '<vector' not in s or '<group' in s: continue
    vw = re.search(r'viewportWidth="([^"]+)"', s).group(1)
    vh = re.search(r'viewportHeight="([^"]+)"', s).group(1)
    paths = []
    for m in re.finditer(r'<path\b(.*?)/>', s, re.S):
        a = m.group(1)
        d = re.search(r'pathData="([^"]+)"', a)
        if not d: continue
        entry = {'d': d.group(1)}
        if 'fillType="evenOdd"' in a: entry['rule'] = 'evenodd'
        al = re.search(r'fillAlpha="([^"]+)"', a)
        if al: entry['o'] = al.group(1)
        if 'strokeColor' in a and 'fillColor' not in a: continue
        paths.append(entry)
    if paths: out[name[3:]] = {'vb': f'0 0 {vw} {vh}', 'paths': paths}
def camel(n):
    p = n.split('_'); return p[0] + ''.join(x.title() for x in p[1:])
lines = ['export interface ApkIcon {', '  viewBox: string;', "  paths: { d: string; rule?: 'evenodd'; opacity?: string }[];", '}', '', 'export const APK_ICONS: Record<string, ApkIcon> = {']
for k, v in out.items():
    ps = ', '.join('{ d: ' + json.dumps(p['d']).replace('"', "'") + (f", rule: 'evenodd'" if p.get('rule') else '') + (f", opacity: '{p['o']}'" if p.get('o') else '') + ' }' for p in v['paths'])
    lines.append(f"  {camel(k)}: {{ viewBox: '{v['vb']}', paths: [{ps}] }},")
lines += ['};', '', 'export type ApkIconName = keyof typeof APK_ICONS;', '']
open('src/app/shared/icons/apk-icons.ts', 'w', encoding='utf-8', newline='\n').write('\n'.join(lines))
print(len(out), 'icons:', ' '.join(camel(k) for k in out))
