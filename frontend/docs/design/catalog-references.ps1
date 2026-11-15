# System.Drawing reads originals without modifying them.
param([switch]$ContactSheets)
Add-Type -AssemblyName System.Drawing
$titles = @'
Template collage|Access review roadmap|Application entitlements|Campaign population|Campaign exclusions|Application management|Campaign decisions|Campaign schedule|Request submission|Delegation management|Recovery settings|Scheduled reports|Provisioning execution|Delegation management|Workflow designer|Connector configuration|Escalations and reminders|Non-connected approval|Provisioning rule|Access review dashboard
Attribute mapping|Audit dashboard|Non-connected SLA|Provisioning rule|SoD remediation|Permission definition|SoD investigation|Provisioning rollback|Connector reconciliation|Permission editor|Exception monitoring|Connector configuration|Monitoring execution|Campaign configuration|Permissions matrix|Provisioning validation|Email configuration|Campaign notifications|User identity|Provisioning flow
Advanced SoD conditions|Dormant accounts|Report builder|Campaign schedule|Provisioning rules|Advanced provisioning rules|Entitlement hierarchy|Provisioning rule|Account details|Alert investigation|Manual fulfillment|Provisioning step|Provisioning configuration|Retry policies|Non-connected reconciliation|Non-connected offboarding|Workflow designer|Manual requests|Reviewer workspace|Retry configuration
Account validation|Workflow instances|Account management|Task management|Provisioning collision|Compensating controls|IT audit logs|Continuous SoD monitoring|Audit history|Provisioning rule|Permission mapping|Campaign list|Function definition|Policy violations|Workflow recovery|Administration collage|Failed operations|Provisioning rule|Provisioning simulation|User activity
Non-connected permission editor|Campaign audit|Effective access simulation|Alert investigation|Connector mapping|Delegation constraints|Compensating control details|Permission definition|Bulk approval|Scheduler management|SoD exception approval|Provisioning jobs|Rule execution log|Campaign configuration|Manager review|Second-level approval|Recovery policy|Approval management|Dynamic approver rule|Effective access log
Account creation|Rule import mapping|Entitlement risk|Policy simulation|SoD simulation|Campaign scope|Campaign population|Inheritance configuration|Entitlement details|Workflow definitions|Risk policy|Security events|Approval history|Manual fulfillment verification|SoD exception configuration|Risk approval history|Discovery logs|Provisioning logs|Connector logs|Scheduling configuration
Campaign dashboard|Connector logs|SoD policy designer|Manual intervention|Conditional branch|Reconciliation differences|Function hierarchy|Non-connected support|Alert evidence|Risk scoring configuration|Job schedule|Risk simulation|Rollback recovery|Dynamic permissions|Delegation listing|Configuration master|Policy version comparison|My access review|Connector provisioning|SoD template validation
Campaign roles|Provisioning queue|Connector notifications|Manual provisioning|Rule validation|User audit|SoD rule library|Risk model versions|Non-connected review|Application onboarding|My requests|Application details|Delegation form|Account correlation|Campaign review|Temporary coverage|Entitlement ownership|Delegation audit|Connector retry|SoD rule designer
Connector audit|Campaign decision rules|Audit reports collage|Dashboard collage|Access review designer|Provisioning process|Template comparison|Campaign dashboard|Identity management|My requests|Request approval|Template approval|Campaign scope|Governance dashboard|Review designer|Campaign configuration|Reviewer flow|Provisioning rule|Provisioning application scope|Connector mapping
User administration|SoD renewal|Identity correlation|Identities|Lifecycle events|Manager relationships|Non-connected controls|Service accounts|Provisioning operations|Reconciliation|Access checks|Control testing|Connector health|Connector configuration|Provisioning process|Non-connected dependencies|Permission editor|Provisioning policy|User access|Provisioning inputs
Compliance reports|Request details|Entitlement catalog|Administration dashboard|Discovery jobs|Directory discovery|Non-connected basics|Shared accounts|Provisioning process|Screen collage|Screen collage|Screen collage|Alert configuration|Permission editor|Approval exception|Team approvals|Role management|Risk approval workflow|Review workspace|Provisioning connectors
Connector validation|Request management|Non-connected system flavor|Application accounts|Provisioning process|Screen collage|Connector configuration|Rule conditions|Provisioning history|Application policies|Synchronization|SoD template|Workflow designer|Application approval|Permission conflict resolution|Delegated approvals|Job templates|Provisioning access scope|Security settings|Provisioning simulation
Workflow reports|Campaign list|Governance reports|Access review designer|Scheduler jobs|Administration dashboard|Provisioning audit|Entitlement management|Screen collage|Provisioning errors|SoD rule templates|Provisioning designer|Screen collage
'@ -split '[|\r\n]+' | Where-Object { $_ }
$darkIds = @(19,20,24,44,45,48,78,79,93,94,165,166,175,176,178,179,238)
$compositeIds = @(1,18,76,163,164,210,211,212,226,249,253)
$lightNavigationIds = @(4,5,9,57,59,72,95,96,106,107,121,138,155,168,173,222,228,242,244)
$files = @(Get-ChildItem "$PSScriptRoot/screenshots" -File | Sort-Object Name)
if ($titles.Count -ne $files.Count) { throw "Expected $($files.Count) titles, found $($titles.Count)" }
$entries = for ($i = 0; $i -lt $files.Count; $i++) {
  $file = $files[$i]
  $id = [int]$file.Name.Substring(3,3)
  $bitmap = [System.Drawing.Bitmap]::FromFile($file.FullName)
  $family = if ($id -eq 2) { 'roadmap' } elseif ($compositeIds -contains $id) { 'composite' } elseif ($darkIds -contains $id) { 'dark-content' } elseif ($lightNavigationIds -contains $id) { 'light-navigation' } else { 'navy-navigation-light-content' }
  [ordered]@{
    id = 'UI-{0:D3}' -f $id; file = 'screenshots/' + $file.Name; title = $titles[$i]
    width = $bitmap.Width; height = $bitmap.Height
    sha256 = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    family = $family; inspection = 'Visual contact-sheet review; selected anchors additionally inspected at full resolution'
    contactSheet = 'review/sheet-{0}.jpg' -f [Math]::Floor($i / 20)
    role = if ($id -eq 246) { 'primary-shell' } elseif ($id -in @(181,37)) { 'supporting-full-resolution' } else { 'catalog-reference' }
  }
  $bitmap.Dispose()
}
$manifest = [ordered]@{
  schemaVersion = 1; referenceCount = $files.Count; primaryReference = 'UI-246'
  baseline = 'Navy navigation with light content. Alternative themes retained as references, not blended.'
  fidelity = 'Screenshot-derived shell; no pixel-perfect claim. See DESIGN-SYSTEM.md for provisional values and differences.'
  screens = @($entries)
} | ConvertTo-Json -Depth 6
[System.IO.File]::WriteAllText("$PSScriptRoot/screen-reference-manifest.json", $manifest, (New-Object System.Text.UTF8Encoding $false))

if ($ContactSheets) {
  New-Item -ItemType Directory -Force "$PSScriptRoot/review" | Out-Null
  $font = New-Object System.Drawing.Font 'Arial',12
  for ($batch = 0; $batch -lt [Math]::Ceiling($files.Count / 20); $batch++) {
    $canvas = New-Object System.Drawing.Bitmap 1600,1100
    $graphics = [System.Drawing.Graphics]::FromImage($canvas)
    $graphics.Clear([System.Drawing.Color]::White)
    for ($i = 0; $i -lt 20; $i++) {
      $index = $batch * 20 + $i
      if ($index -ge $files.Count) { break }
      $image = [System.Drawing.Image]::FromFile($files[$index].FullName)
      $x = ($i % 4) * 400
      $y = [Math]::Floor($i / 4) * 220
      $graphics.DrawImage($image, $x, $y, 400, 195)
      $graphics.DrawString($files[$index].Name.Substring(0,6), $font, [System.Drawing.Brushes]::Black, $x, ($y + 197))
      $image.Dispose()
    }
    $canvas.Save("$PSScriptRoot/review/sheet-$batch.jpg")
    $graphics.Dispose()
    $canvas.Dispose()
  }
  $font.Dispose()
}
