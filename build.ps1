# Baut aus content/ die Seiten themen/*.html und assets/nodes.js.
# Aufruf (PowerShell): powershell -ExecutionPolicy Bypass -File build.ps1

param([switch]$Lax)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$utf8 = New-Object System.Text.UTF8Encoding($false)
$STAND_DEFAULT = 'Oktober 2026'

function Read-Utf8($p) { [System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8) }
function Write-Utf8($p, $t) {
  $dir = Split-Path -Parent $p
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force $dir | Out-Null }
  [System.IO.File]::WriteAllText($p, $t, $utf8)
}
function Esc($s) {
  if ($null -eq $s) { return '' }
  return $s.Replace('&', '&amp;').Replace('<', '&lt;').Replace('>', '&gt;').Replace('"', '&quot;')
}
function JsStr($s) {
  if ($null -eq $s) { $s = '' }
  $s = $s.Replace('\', '\\').Replace('"', '\"').Replace("`r", '').Replace("`n", '\n').Replace("`t", '\t')
  return '"' + $s + '"'
}
function Slug($s) {
  $s = $s.ToLower().Replace([string][char]0xE4, 'ae').Replace([string][char]0xF6, 'oe').Replace([string][char]0xFC, 'ue').Replace([string][char]0xDF, 'ss')
  return ([regex]::Replace($s, '[^a-z0-9]+', '-')).Trim('-')
}

$linkEval = [System.Text.RegularExpressions.MatchEvaluator] {
  param($m)
  $text = $m.Groups[1].Value
  $url = $m.Groups[2].Value
  if ($url.StartsWith('thema:')) {
    return '<a class="int" href="' + $url.Substring(6) + '.html">' + $text + '</a>'
  }
  return '<a class="ext" href="' + $url + '" target="_blank" rel="noopener noreferrer">' + $text + '</a>'
}

function Inline($s) {
  $s = Esc $s
  $s = [regex]::Replace($s, '`([^`]+)`', '<code>$1</code>')
  $s = [regex]::Replace($s, '\*\*(.+?)\*\*', '<strong>$1</strong>')
  $s = [regex]::Replace($s, '(?<![\*\w])\*(?!\s)([^*]+?)(?<!\s)\*(?![\*\w])', '<em>$1</em>')
  $s = [regex]::Replace($s, '\[([^\]]+)\]\(([^)]+)\)', $linkEval)
  return $s
}
function Plain($s) {
  $s = [regex]::Replace($s, '\[([^\]]+)\]\(([^)]+)\)', '$1')
  $s = $s.Replace('**', '').Replace('`', '')
  $s = [regex]::Replace($s, '(?<![\*\w])\*(?!\s)([^*]+?)(?<!\s)\*(?![\*\w])', '$1')
  return $s
}

function Render-Blocks($lines) {
  $out = New-Object System.Text.StringBuilder
  $i = 0
  $n = $lines.Count
  while ($i -lt $n) {
    $l = $lines[$i]
    if ($l.Trim() -eq '') { $i++; continue }

    if ($l -match '^\|') {
      $rows = @()
      while ($i -lt $n -and $lines[$i] -match '^\|') { $rows += $lines[$i]; $i++ }
      $cells = @()
      foreach ($r in $rows) {
        if ($r -match '^\|\s*:?-{2,}') { continue }
        $c = $r.Trim().Trim('|').Split('|') | ForEach-Object { $_.Trim() }
        $cells += , @($c)
      }
      [void]$out.Append('<div class="table-wrap"><table><thead><tr>')
      foreach ($c in $cells[0]) { [void]$out.Append('<th>' + (Inline $c) + '</th>') }
      [void]$out.Append('</tr></thead><tbody>')
      for ($k = 1; $k -lt $cells.Count; $k++) {
        [void]$out.Append('<tr>')
        foreach ($c in $cells[$k]) { [void]$out.Append('<td>' + (Inline $c) + '</td>') }
        [void]$out.Append('</tr>')
      }
      [void]$out.Append('</tbody></table></div>' + "`n")
      continue
    }

    if ($l -match '^- \[[ xX]\] ') {
      [void]$out.Append('<ul class="checklist">')
      $idx = 0
      while ($i -lt $n -and $lines[$i] -match '^- \[[ xX]\] ') {
        $t = $lines[$i] -replace '^- \[[ xX]\] ', ''
        [void]$out.Append('<li><label><input type="checkbox" data-i="' + $idx + '"><span>' + (Inline $t) + '</span></label></li>')
        $idx++; $i++
      }
      [void]$out.Append('</ul>' + "`n")
      continue
    }

    if ($l -match '^- ') {
      [void]$out.Append('<ul>')
      while ($i -lt $n -and $lines[$i] -match '^- ') {
        [void]$out.Append('<li>' + (Inline ($lines[$i] -replace '^- ', '')) + '</li>')
        $i++
      }
      [void]$out.Append('</ul>' + "`n")
      continue
    }

    if ($l -match '^\d+\. ') {
      [void]$out.Append('<ol>')
      while ($i -lt $n -and $lines[$i] -match '^\d+\. ') {
        [void]$out.Append('<li>' + (Inline ($lines[$i] -replace '^\d+\. ', '')) + '</li>')
        $i++
      }
      [void]$out.Append('</ol>' + "`n")
      continue
    }

    if ($l -match '^> ') {
      $buf = @()
      while ($i -lt $n -and $lines[$i] -match '^> ?') { $buf += ($lines[$i] -replace '^> ?', ''); $i++ }
      [void]$out.Append('<aside class="note"><p>' + (Inline ($buf -join ' ')) + '</p></aside>' + "`n")
      continue
    }

    $buf = @()
    while ($i -lt $n -and $lines[$i].Trim() -ne '' -and $lines[$i] -notmatch '^(\||- |\d+\. |> |## )') {
      $buf += $lines[$i].Trim(); $i++
    }
    [void]$out.Append('<p>' + (Inline ($buf -join ' ')) + '</p>' + "`n")
  }
  return $out.ToString()
}

# ---------- Bereiche laden ----------
$cfg = (Read-Utf8 (Join-Path $root 'content/bereiche.json')) | ConvertFrom-Json
$bereiche = @{}
foreach ($b in $cfg.bereiche) { $bereiche[$b.id] = $b }

# ---------- Themen laden ----------
$topics = @()
Get-ChildItem (Join-Path $root 'content/themen') -Filter *.md | ForEach-Object {
  $raw = (Read-Utf8 $_.FullName).TrimStart([char]0xFEFF) -replace "`r`n", "`n"
  $lines = $raw -split "`n"
  if ($lines[0].Trim() -ne '---') { throw "Front matter fehlt: $($_.Name)" }
  $meta = @{}
  $j = 1
  while ($lines[$j].Trim() -ne '---') {
    $kv = $lines[$j] -split ':', 2
    if ($kv.Count -eq 2) { $meta[$kv[0].Trim()] = $kv[1].Trim() }
    $j++
  }
  $body = $lines[($j + 1)..($lines.Count - 1)]

  $lead = @(); $sections = @(); $cur = $null
  foreach ($bl in $body) {
    if ($bl -match '^## ') {
      if ($cur) { $sections += $cur }
      $cur = @{ title = ($bl -replace '^## ', '').Trim(); lines = @() }
    } elseif ($cur) { $cur.lines += $bl } else { $lead += $bl }
  }
  if ($cur) { $sections += $cur }

  $id = $meta['id']
  if (-not $id) { throw "id fehlt: $($_.Name)" }
  if (-not $bereiche.ContainsKey($meta['bereich'])) { throw "Unbekannter Bereich in $($_.Name)" }

  $leadParas = ($lead -join "`n") -split "`n\s*`n" | Where-Object { $_.Trim() -ne '' }
  $words = ($body -join ' ').Split(' ', [System.StringSplitOptions]::RemoveEmptyEntries).Count

  $topics += [pscustomobject]@{
    id = $id; bereich = $meta['bereich']; titel = $meta['titel']; kurz = $meta['kurztitel']
    icon = $meta['icon']; order = [int]$meta['reihenfolge']
    verwandt = @(($meta['verwandt'] -split ',') | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    video = $meta['video']; stand = $(if ($meta['stand']) { $meta['stand'] } else { $STAND_DEFAULT })
    lead = $lead; leadFirst = (Plain ($leadParas | Select-Object -First 1).Replace("`n", ' ').Trim())
    sections = $sections; minutes = [Math]::Max(1, [Math]::Ceiling($words / 190))
  }
}
$topics = @($topics | Sort-Object bereich, order)
$byId = @{}
foreach ($t in $topics) { $byId[$t.id] = $t }
foreach ($t in $topics) {
  $t.verwandt = @($t.verwandt | Where-Object {
    if ($byId.ContainsKey($_)) { $true }
    elseif ($Lax) { Write-Warning "Verwandt unbekannt: $($t.id) -> $_"; $false }
    else { throw "Verwandt unbekannt: $($t.id) -> $_" }
  })
}

# ---------- assets/nodes.js ----------
$nodes = New-Object System.Collections.Generic.List[string]
$hub = $cfg.hub
$nodes.Add('{"id":"hub","label":' + (JsStr $hub.label) + ',"short":' + (JsStr $hub.short) + ',"icon":' + (JsStr $hub.icon) + ',"category":"hub","parent":null,"order":0,"description":' + (JsStr $hub.description) + ',"page":"","relatedIds":[]}')
foreach ($b in $cfg.bereiche) {
  $nodes.Add('{"id":' + (JsStr $b.id) + ',"label":' + (JsStr $b.label) + ',"short":' + (JsStr $b.short) + ',"icon":' + (JsStr $b.icon) + ',"category":' + (JsStr $b.id) + ',"parent":"hub","order":' + $b.order + ',"description":' + (JsStr $b.description) + ',"page":"","relatedIds":[]}')
}
foreach ($t in $topics) {
  $rel = ($t.verwandt | ForEach-Object { JsStr $_ }) -join ','
  $nodes.Add('{"id":' + (JsStr $t.id) + ',"label":' + (JsStr $t.titel) + ',"short":' + (JsStr $t.kurz) + ',"icon":' + (JsStr $t.icon) + ',"category":' + (JsStr $t.bereich) + ',"parent":' + (JsStr $t.bereich) + ',"order":' + $t.order + ',"description":' + (JsStr $t.leadFirst) + ',"page":' + (JsStr ('themen/' + $t.id + '.html')) + ',"relatedIds":[' + $rel + ']}')
}
Write-Utf8 (Join-Path $root 'assets/nodes.js') ("// Automatisch erzeugt von build.ps1, nicht von Hand bearbeiten.`nwindow.S4F_NODES = [`n" + ($nodes -join ",`n") + "`n];`n")

# ---------- Themenseiten ----------
$tpl = Read-Utf8 (Join-Path $root 'content/_vorlage.html')

foreach ($t in $topics) {
  $b = $bereiche[$t.bereich]
  $sb = New-Object System.Text.StringBuilder
  $toc = New-Object System.Text.StringBuilder

  foreach ($s in $t.sections) {
    $sid = Slug $s.title
    $cls = 'sec'
    $tl = $s.title.ToLower()
    if ($tl -like 'auf einen blick*') { $cls = 'sec glance' }
    elseif ($tl -like 'beispiel*') { $cls = 'sec example' }
    elseif ($tl -like 'checkliste*') { $cls = 'sec checks' }
    elseif ($tl -like 'quellen*') { $cls = 'sec sources' }
    [void]$sb.Append('<section class="' + $cls + '" id="' + $sid + '"><h2>' + (Inline $s.title) + '</h2>' + "`n")
    if ($cls -eq 'sec checks') { [void]$sb.Append('<p class="progress" aria-live="polite"></p>' + "`n") }
    [void]$sb.Append((Render-Blocks $s.lines))
    [void]$sb.Append('</section>' + "`n")
    [void]$toc.Append('<li><a href="#' + $sid + '">' + (Inline $s.title) + '</a></li>')
  }

  $video = ''
  if ($t.video) {
    $vid = $null
    if ($t.video -match 'youtu\.be/([\w-]+)') { $vid = $Matches[1] }
    elseif ($t.video -match 'v=([\w-]+)') { $vid = $Matches[1] }
    if ($vid) { $video = '<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/' + $vid + '" title="Video zu ' + (Esc $t.titel) + '" loading="lazy" allowfullscreen></iframe></div>' }
  }

  $related = ''
  if ($t.verwandt.Count -gt 0) {
    $rb = New-Object System.Text.StringBuilder
    foreach ($rid in $t.verwandt) {
      $r = $byId[$rid]
      [void]$rb.Append('<a class="rel" data-b="' + $r.bereich + '" href="' + $r.id + '.html"><span class="ic">' + $r.icon + '</span><span><small>' + (Esc $bereiche[$r.bereich].short) + '</small>' + (Esc $r.kurz) + '</span></a>')
    }
    $related = '<section class="related"><h2>Verwandte Themen</h2><div class="rel-grid">' + $rb.ToString() + '</div></section>'
  }

  $same = @($topics | Where-Object { $_.bereich -eq $t.bereich })
  $pos = [Array]::IndexOf(($same | ForEach-Object { $_.id }), $t.id)
  $prev = ''; $next = ''
  if ($pos -gt 0) { $p = $same[$pos - 1]; $prev = '<a class="pn prev" href="' + $p.id + '.html"><small>Zurück</small>' + (Esc $p.kurz) + '</a>' } else { $prev = '<span></span>' }
  if ($pos -lt $same.Count - 1) { $nx = $same[$pos + 1]; $next = '<a class="pn next" href="' + $nx.id + '.html"><small>Weiter</small>' + (Esc $nx.kurz) + '</a>' } else { $next = '<span></span>' }

  $leadHtml = Render-Blocks $t.lead
  $desc = $t.leadFirst
  if ($desc.Length -gt 155) { $desc = $desc.Substring(0, 152).TrimEnd() + '...' }

  $html = $tpl
  $html = $html.Replace('{{TITEL}}', (Esc $t.titel))
  $html = $html.Replace('{{TITEL_RAW}}', (Esc $t.titel))
  $html = $html.Replace('{{DESC}}', (Esc $desc))
  $html = $html.Replace('{{ID}}', $t.id)
  $html = $html.Replace('{{BEREICH}}', $t.bereich)
  $html = $html.Replace('{{BEREICH_LABEL}}', (Esc $b.label))
  $html = $html.Replace('{{BEREICH_SHORT}}', (Esc $b.short))
  $html = $html.Replace('{{KURZ}}', (Esc $t.kurz))
  $html = $html.Replace('{{ICON}}', $t.icon)
  $html = $html.Replace('{{LEAD}}', $leadHtml)
  $html = $html.Replace('{{TOC}}', $toc.ToString())
  $html = $html.Replace('{{VIDEO}}', $video)
  $html = $html.Replace('{{SECTIONS}}', $sb.ToString())
  $html = $html.Replace('{{RELATED}}', $related)
  $html = $html.Replace('{{PREV}}', $prev)
  $html = $html.Replace('{{NEXT}}', $next)
  $html = $html.Replace('{{MIN}}', [string]$t.minutes)
  $html = $html.Replace('{{STAND}}', (Esc $t.stand))
  Write-Utf8 (Join-Path $root ('themen/' + $t.id + '.html')) $html
}

Write-Host ("Fertig: {0} Themenseiten, assets/nodes.js" -f $topics.Count)
