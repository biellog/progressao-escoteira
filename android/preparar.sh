#!/usr/bin/env bash
# Gera o projeto Android (Capacitor), aplica ícone, splash e versão.
# Uso: bash android/preparar.sh <versionName> <versionCode>
set -euo pipefail
cd "$(dirname "$0")"
VERSAO="${1:-1.0.0}"; CODIGO="${2:-1}"
ICONE=../app/icons/icon-512.png

npm install --no-audit --no-fund
rm -rf android
npx cap add android

RES=android/app/src/main/res
# ícones (sem ícone adaptativo: usa o PNG direto)
rm -rf "$RES/mipmap-anydpi-v26"
for par in mdpi:48 hdpi:72 xhdpi:96 xxhdpi:144 xxxhdpi:192; do
  d=${par%%:*}; s=${par##*:}
  for n in ic_launcher ic_launcher_round ic_launcher_foreground; do
    convert "$ICONE" -resize ${s}x${s} "$RES/mipmap-$d/$n.png"
  done
done
# splash escuro com o ícone no centro
for f in $(find "$RES" -name splash.png); do
  read -r w h < <(identify -format '%w %h\n' "$f")
  lado=$(( (w < h ? w : h) / 3 ))
  convert -size ${w}x${h} xc:'#0d1117' \( "$ICONE" -resize ${lado}x${lado} \) -gravity center -composite "$f"
done
# versão
sed -i "s/versionCode [0-9]*/versionCode $CODIGO/; s/versionName \"[^\"]*\"/versionName \"$VERSAO\"/" android/app/build.gradle
echo "Projeto Android pronto: v$VERSAO ($CODIGO)"
