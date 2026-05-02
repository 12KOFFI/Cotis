<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Rapport {{ $groupe->nom }}</title>
<style>
  body { font-family: 'Helvetica', sans-serif; color: #111; font-size: 12px; }
  h1 { color: #0a3d91; margin: 0 0 4px; }
  .meta { color: #666; margin-bottom: 18px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 6px 8px; border-bottom: 1px solid #eee; text-align: left; }
  th { background: #0a3d91; color: #fff; }
  .total { margin-top: 14px; font-size: 14px; font-weight: bold; }
</style>
</head>
<body>
  <h1>Rapport de cotisations</h1>
  <div class="meta">{{ $groupe->nom }} — Édité le {{ $date->format('d/m/Y H:i') }}</div>
  <table>
    <thead>
      <tr><th>Date</th><th>Membre</th><th>Type</th><th>Mode</th><th>Statut</th><th>Montant (FCFA)</th></tr>
    </thead>
    <tbody>
      @foreach($paiements as $p)
      <tr>
        <td>{{ $p->date_paiement?->format('d/m/Y') }}</td>
        <td>{{ trim(($p->membre->prenom ?? '').' '.($p->membre->nom ?? '')) }}</td>
        <td>{{ ucfirst($p->type) }}</td>
        <td>{{ ucfirst($p->mode) }}</td>
        <td>{{ ucfirst($p->statut) }}</td>
        <td>{{ number_format($p->montant, 0, ',', ' ') }}</td>
      </tr>
      @endforeach
    </tbody>
  </table>
  <div class="total">Total reçu : {{ number_format($total, 0, ',', ' ') }} FCFA</div>
</body>
</html>
