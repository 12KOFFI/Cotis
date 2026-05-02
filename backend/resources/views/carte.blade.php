<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Carte membre</title>
<style>
  body { font-family: 'Helvetica', sans-serif; margin:0; padding:0; }
  .card { width: 240px; height: 380px; padding: 14px; color: #fff;
    background: linear-gradient(160deg,#0a3d91 0%,#1e6dff 55%,#4aa6ff 100%);
    border-radius: 16px; position: relative; }
  .brand { font-size: 11px; letter-spacing: 2px; opacity: .85; }
  .groupe { font-size: 16px; font-weight: bold; margin-top: 4px; }
  .name { font-size: 19px; font-weight: bold; margin-top: 18px; }
  .role { font-size: 11px; opacity: .85; }
  .qr { background: #fff; padding: 6px; border-radius: 10px; margin: 14px auto 0; width: 160px; text-align: center;}
  .qr img { width: 150px; height: 150px; }
  .footer { position: absolute; bottom: 10px; left: 14px; right: 14px; font-size: 10px; opacity: .9; }
</style>
</head>
<body>
  <div class="card">
    <div class="brand">COTISPRO</div>
    <div class="groupe">{{ $groupe->nom }}</div>
    <div class="name">{{ trim(($membre->prenom ?? '').' '.$membre->nom) }}</div>
    <div class="role">{{ ucfirst($membre->role) }} — #{{ str_pad($membre->id,5,'0',STR_PAD_LEFT) }}</div>
    <div class="qr"><img src="data:image/png;base64,{{ $qr }}"/></div>
    <div class="footer">Scanner pour voir l'historique de cotisations.</div>
  </div>
</body>
</html>
