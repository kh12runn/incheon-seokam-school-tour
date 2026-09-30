param([string]$OutputDirectory)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$payload=gh api 'repos/kh12runn/incheon-seokam-school-photos/contents/school-assets/catalog.json?ref=main' | ConvertFrom-Json
if($LASTEXITCODE -ne 0){throw 'Photo catalog unavailable'}
$catalog=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($payload.content)) | ConvertFrom-Json
$ids=@('1F_3-1','1F_3-2','1F_3-3','3F_5-1','3F_5-2','4F_2-2','4F_2-3','4F_4-1','4F_4-2','4F_6-1','4F_6-2','4F_6-5','4F_6-7')
$root=New-Item -ItemType Directory -Path $OutputDirectory -Force
foreach($id in $ids){
  $room=$catalog.rooms.$id
  $manifest=Invoke-RestMethod -Uri ('https://school-tour-production.up.railway.app/api/rooms/'+$id+'/assets')
  $dir=New-Item -ItemType Directory -Path (Join-Path $root.FullName $id) -Force
  $canvas=New-Object Drawing.Bitmap(2400,([int][Math]::Ceiling($room.images.Count/3)*640))
  $graphics=[Drawing.Graphics]::FromImage($canvas);$graphics.Clear([Drawing.Color]::White)
  $font=New-Object Drawing.Font('Arial',24)
  try{
    for($i=0;$i -lt $room.images.Count;$i++){
      $photo=$room.images[$i];$target=Join-Path $dir.FullName (($i+1).ToString()+'.jpg')
      Invoke-WebRequest -UseBasicParsing -Uri ('https://school-tour-production.up.railway.app/api/rooms/'+$id+'/assets/'+$photo.id) -OutFile $target
      $source=[Drawing.Image]::FromFile($target)
      try{
        $x=($i%3)*800;$y=[int][Math]::Floor($i/3)*640
        $graphics.DrawString(($id+' / '+($i+1)), $font,[Drawing.Brushes]::Black,$x,$y)
        $scale=[Math]::Min(800/$source.Width,600/$source.Height)
        $graphics.DrawImage($source,[int]$x,[int]($y+40),[int]($source.Width*$scale),[int]($source.Height*$scale))
      }finally{$source.Dispose()}
    }
    $canvas.Save((Join-Path $root.FullName ($id+'.jpg')),[Drawing.Imaging.ImageFormat]::Jpeg)
  }finally{$graphics.Dispose();$canvas.Dispose();$font.Dispose()}
  [pscustomobject]@{roomId=$id;count=$room.images.Count;revision=$room.revision;imageIds=@($room.images.id)} | ConvertTo-Json -Compress
}
