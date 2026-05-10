<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Carte membre</title>
<style>
  @page { margin: 0px; }
  body { font-family: 'Helvetica', sans-serif; margin: 0; padding: 0; background-color: #ffffff; }
  .wrapper { width: 100%; height: 100%; text-align: center; padding-top: 20px; }
  .card-container {
    width: 360px;
    height: 220px;
    box-sizing: border-box;
    background-color: #1e40af; /* Lighter blue (blue-800) */
    color: #ffffff;
    padding: 20px 24px;
    margin: 0 auto;
    overflow: hidden;
    position: relative;
    border-radius: 16px;
    text-align: left;
  }
  .gold-bar {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 6px;
    background: linear-gradient(to right, #facc15, #eab308, #ca8a04);
  }
  .header-table { width: 100%; margin-bottom: 25px; margin-top: 5px; }
  .header-table td { vertical-align: top; }
  .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #bfdbfe; }
  .groupe { font-size: 18px; font-weight: bold; margin-top: 4px; color: #ffffff; }
  .main-table { width: 100%; }
  .main-table td { vertical-align: bottom; }
  .name { font-size: 20px; font-weight: bold; margin-bottom: 4px; color: #ffffff; }
  .role { font-size: 12px; color: #93c5fd; text-transform: capitalize; }
  .qr-container {
    background-color: #ffffff;
    padding: 6px;
    border-radius: 8px;
    text-align: center;
    width: 65px;
    height: 65px;
  }
  .qr-container img { width: 65px; height: 65px; }
  .footer-table { width: 100%; margin-top: 25px; border-top: 1px solid #3b82f6; padding-top: 10px; }
  .footer-text { font-size: 9px; color: #bfdbfe; }
  .footer-brand { font-size: 10px; font-weight: bold; letter-spacing: 2px; color: #93c5fd; text-align: right; }
</style>
</head>
<body>
  <div class="wrapper">
    <div class="card-container">
      <div class="gold-bar"></div>
      <table class="header-table">
        <tr>
          <td>
            <div class="label">Carte Membre</div>
            <div class="groupe">{{ $groupe->nom }}</div>
          </td>
        </tr>
      </table>

      <table class="main-table">
        <tr>
          <td>
            <div class="label" style="margin-bottom: 4px;">Titulaire</div>
            <div class="name">{{ trim(($membre->prenom ?? '').' '.$membre->nom) }}</div>
            <div class="role">{{ $membre->role === 'gestionnaire' ? 'Administrateur' : $membre->role }}</div>
          </td>
          <td style="text-align: right; width: 80px;">
            <div class="qr-container">
              <img src="data:image/png;base64,{{ $qr }}"/>
            </div>
          </td>
        </tr>
      </table>

      <table class="footer-table">
        <tr>
          <td class="footer-text">Scanner pour vérifier l'authenticité</td>
          <td class="footer-brand">COTISPRO</td>
        </tr>
      </table>
    </div>
  </div>
</body>
</html>
