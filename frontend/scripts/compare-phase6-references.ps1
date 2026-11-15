param([string]$ComparisonRoot = (Join-Path $PSScriptRoot '../docs/design/phase6-comparisons'))
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
public static class ReferenceComparison {
  public static double[] Run(string reference, string capture, string difference, string overlay) {
    using(var source = new Bitmap(reference)) using(var actual = new Bitmap(capture)) {
      if(source.Width != actual.Width || source.Height != actual.Height) throw new ArgumentException("Raster dimensions must match; images are not resized.");
      int w=source.Width,h=source.Height;
      using(var a=new Bitmap(w,h,PixelFormat.Format32bppArgb)) using(var b=new Bitmap(w,h,PixelFormat.Format32bppArgb))
      using(var diff=new Bitmap(w,h,PixelFormat.Format32bppArgb)) using(var blend=new Bitmap(w,h,PixelFormat.Format32bppArgb)) {
        using(var g=Graphics.FromImage(a)) g.DrawImageUnscaled(source,0,0);
        using(var g=Graphics.FromImage(b)) g.DrawImageUnscaled(actual,0,0);
        var rect=new Rectangle(0,0,w,h);
        var ad=a.LockBits(rect,ImageLockMode.ReadOnly,PixelFormat.Format32bppArgb);
        var bd=b.LockBits(rect,ImageLockMode.ReadOnly,PixelFormat.Format32bppArgb);
        var dd=diff.LockBits(rect,ImageLockMode.WriteOnly,PixelFormat.Format32bppArgb);
        var od=blend.LockBits(rect,ImageLockMode.WriteOnly,PixelFormat.Format32bppArgb);
        int length=ad.Stride*h;var av=new byte[length];var bv=new byte[length];var dv=new byte[length];var ov=new byte[length];
        Marshal.Copy(ad.Scan0,av,0,length);Marshal.Copy(bd.Scan0,bv,0,length);
        double sum=0,changed=0,sidebar=0,header=0,content=0;long ns=0,nh=0,nc=0;
        for(int y=0;y<h;y++) for(int x=0;x<w;x++) {
          int i=y*ad.Stride+x*4,max=0;
          for(int channel=0;channel<3;channel++) {int delta=Math.Abs(av[i+channel]-bv[i+channel]);sum+=delta;max=Math.Max(max,delta);dv[i+channel]=(byte)Math.Min(255,delta*3);ov[i+channel]=(byte)((av[i+channel]+bv[i+channel])/2);if(x<274)sidebar+=delta;else if(y<50)header+=delta;else content+=delta;}
          if(max>20)changed++;dv[i+3]=255;ov[i+3]=255;if(x<274)ns++;else if(y<50)nh++;else nc++;
        }
        Marshal.Copy(dv,0,dd.Scan0,length);Marshal.Copy(ov,0,od.Scan0,length);
        a.UnlockBits(ad);b.UnlockBits(bd);diff.UnlockBits(dd);blend.UnlockBits(od);
        diff.Save(difference,ImageFormat.Png);blend.Save(overlay,ImageFormat.Png);
        return new double[]{sum/(w*h*3),changed/(w*h)*100,sidebar/(ns*3),header/(nh*3),content/(nc*3)};
      }
    }
  }
}
'@
$root = [IO.Path]::GetFullPath($ComparisonRoot)
$references = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../docs/design/screenshots'))
$manifest = Get-Content -LiteralPath (Join-Path $root 'manifest.json') -Raw | ConvertFrom-Json
New-Item -ItemType Directory -Path (Join-Path $root 'differences') -Force | Out-Null
$results = foreach($screen in $manifest) {
  $reference = @(Get-ChildItem -LiteralPath $references -Filter ($screen.reference + '__*.png'))
  if($reference.Count -ne 1) { throw "Expected one original reference for $($screen.reference)" }
  $scores = [ReferenceComparison]::Run($reference[0].FullName,(Join-Path $root ('captures/'+$screen.name+'.png')),(Join-Path $root ('differences/'+$screen.name+'-diff.png')),(Join-Path $root ('differences/'+$screen.name+'-overlay.png')))
  [PSCustomObject]@{name=$screen.name;path=$screen.path;reference=$screen.reference;width=$screen.width;height=$screen.height;meanAbsoluteRgb=[Math]::Round($scores[0],2);pixelsOver20Percent=[Math]::Round($scores[1],2);canonicalSidebarMean=[Math]::Round($scores[2],2);canonicalHeaderMean=[Math]::Round($scores[3],2);contentMean=[Math]::Round($scores[4],2)}
}
$results | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $root 'metrics.json') -Encoding UTF8
$lines = @('# Phase 6 raster comparisons','','Generated with `scripts/compare-phase6-references.ps1`. Originals are never resized. Differences amplify absolute RGB deltas by 3; overlays blend both images equally. Metrics describe raster differences, not acceptance scores. Content, text, source variants and font rendering differ intentionally. Canonical region splits use x=274/y=50 even where a reference has different shell geometry; do not interpret these as isolated component fidelity measurements.','','| Screen | Reference | Capture | Difference | Overlay | Mean RGB delta (0-255) | Pixels with channel delta >20 |','| --- | --- | --- | --- | --- | ---: | ---: |')
foreach($result in $results) { $name=$result.name;$lines += "| $name | $($result.reference) | [capture](captures/$name.png) | [difference](differences/$name-diff.png) | [overlay](differences/$name-overlay.png) | $($result.meanAbsoluteRgb) | $($result.pixelsOver20Percent)% |" }
$lines | Set-Content -LiteralPath (Join-Path $root 'INDEX.md') -Encoding UTF8
for($sheet=0;$sheet -lt [Math]::Ceiling($manifest.Count/7);$sheet++) {
  $rows=[Math]::Min(7,$manifest.Count-$sheet*7)
  $bitmap=New-Object Drawing.Bitmap 960,($rows*290)
  $graphics=[Drawing.Graphics]::FromImage($bitmap)
  $graphics.Clear([Drawing.Color]::White)
  $font=New-Object Drawing.Font 'Arial',12
  for($row=0;$row -lt $rows;$row++) {
    $screen=$manifest[$sheet*7+$row]
    $graphics.DrawString(($screen.name+' / '+$screen.reference+' - capture and amplified difference'),$font,[Drawing.Brushes]::Black,8,($row*290))
    $capture=[Drawing.Image]::FromFile((Join-Path $root ('captures/'+$screen.name+'.png')))
    $difference=[Drawing.Image]::FromFile((Join-Path $root ('differences/'+$screen.name+'-diff.png')))
    $graphics.DrawImage($capture,0,($row*290+20),480,270)
    $graphics.DrawImage($difference,480,($row*290+20),480,270)
    $capture.Dispose()
    $difference.Dispose()
  }
  $bitmap.Save((Join-Path $root ('review-sheet-'+($sheet+1)+'.png')),[Drawing.Imaging.ImageFormat]::Png)
  $font.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}
Write-Output "Compared $($results.Count) original-size capture/reference pairs."
