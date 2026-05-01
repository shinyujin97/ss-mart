"""
브랜드 로고 자동 수집 스크립트
Clearbit Logo API → 실패 시 Google Favicon 폴백
"""

import os
import time
import requests

OUTPUT_DIR = "/home/boss/projects/ss-mart/public/brands"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 브랜드 슬러그 → 도메인 매핑
BRAND_DOMAINS = {
    "k2":              "k2safety.co.kr",
    "k2-safety":       "k2safety.co.kr",
    "3m":              "3m.com",
    "otos":            "otos.co.kr",
    "ilteru":          "ilteru.co.kr",
    "piozen":          "piozen.com",
    "cleantop":        "cleantop.co.kr",
    "yak":             "yaksafety.co.kr",
    "ziben":           "ziben.co.kr",
    "kolon":           "kolonsport.com",
    "yuhan-kimberly":  "yuhan-kimberly.co.kr",
    "dongmyung":       "dongmyung.co.kr",
    "safers":          "safers.co.kr",
    "nepa":            "nepa.co.kr",
    "semong":          "semong.co.kr",
    "vicstop":         "vicstop.co.kr",
    "campline":        "campline.co.kr",
    "starzen":         "starzen.co.kr",
    "withus":          "withus.co.kr",
    "gmg":             "gmg.co.kr",
    "dupont":          "dupont.com",
    "prospecs":        "prospecs.com",
    "kleenguard":      "kleenguard.com",
    "kara":            "kara.co.kr",
    "sh-safety":       "sh-safety.co.kr",
    "ssangsol":        "ssangsol.co.kr",
    "yuhan":           "yuhan.co.kr",
    "lecaf":           "lecaf.co.kr",
    "bulls":           "bullssafety.co.kr",
    "carhartt":        "carhartt.com",
    "techline":        "techline.co.kr",
    "smart-safety":    "smart-safety.co.kr",
    "epyunhan":        "epyunhan.co.kr",
    "yk":              "yksafety.co.kr",
    # 상품 없는 브랜드들
    "burtle":          "burtle.jp",
    "jawin":           "jawin.co.jp",
    "aitoz":           "aitoz.co.jp",
    "dickies":         "dickies.com",
    "carhartt":        "carhartt.com",
    "red-wing":        "redwingshoes.com",
    "timberland-pro":  "timberlandpro.com",
    "caterpillar":     "catfootwear.com",
    "3m":              "3m.com",
    "msa":             "msasafety.com",
    "uvex":            "uvex.com",
    "ansell":          "ansell.com",
    "dupont":          "dupont.com",
    "honeywell-safety":"honeywellsafety.com",
    "petzl":           "petzl.com",
    "columbia":        "columbia.com",
    "the-north-face":  "thenorthface.com",
    "bosch":           "bosch.com",
    "dewalt":          "dewalt.com",
    "milwaukee":       "milwaukeetool.com",
    "makita":          "makita.com",
    "stanley":         "stanleytools.com",
}

def fetch_clearbit(domain: str) -> bytes | None:
    url = f"https://logo.clearbit.com/{domain}"
    try:
        r = requests.get(url, timeout=8)
        if r.status_code == 200 and len(r.content) > 500:
            return r.content
    except:
        pass
    return None

def fetch_favicon(domain: str) -> bytes | None:
    url = f"https://www.google.com/s2/favicons?domain={domain}&sz=128"
    try:
        r = requests.get(url, timeout=8)
        if r.status_code == 200 and len(r.content) > 200:
            return r.content
    except:
        pass
    return None

success, failed = [], []

for slug, domain in BRAND_DOMAINS.items():
    out_path = os.path.join(OUTPUT_DIR, f"{slug}.png")
    if os.path.exists(out_path):
        print(f"  ⏭  {slug} — 이미 있음")
        success.append(slug)
        continue

    print(f"  🔍 {slug} ({domain}) ...", end=" ", flush=True)

    data = fetch_clearbit(domain)
    source = "clearbit"

    if not data:
        data = fetch_favicon(domain)
        source = "favicon"

    if data:
        with open(out_path, "wb") as f:
            f.write(data)
        print(f"✅ {source} ({len(data):,}bytes)")
        success.append(slug)
    else:
        print("❌ 실패")
        failed.append(slug)

    time.sleep(0.3)

print(f"\n완료: 성공 {len(success)}개 / 실패 {len(failed)}개")
if failed:
    print("실패 목록:", failed)
