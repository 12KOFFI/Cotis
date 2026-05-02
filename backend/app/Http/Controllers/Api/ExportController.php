<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Groupe;
use App\Models\Paiement;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    public function csv(Request $request, Groupe $groupe)
    {
        $this->authorize($request, $groupe);
        $response = new StreamedResponse(function () use ($groupe) {
            $h = fopen('php://output', 'w');
            fputcsv($h, ['ID', 'Date', 'Membre', 'Type', 'Montant', 'Mode', 'Statut', 'Note']);
            $groupe->paiements()->with('membre')->orderBy('date_paiement', 'desc')->chunk(500, function ($rows) use ($h) {
                foreach ($rows as $p) {
                    fputcsv($h, [
                        $p->id,
                        $p->date_paiement?->format('Y-m-d'),
                        trim(($p->membre->prenom ?? '') . ' ' . ($p->membre->nom ?? '')),
                        $p->type,
                        $p->montant,
                        $p->mode,
                        $p->statut,
                        $p->note,
                    ]);
                }
            });
            fclose($h);
        });
        $response->headers->set('Content-Type', 'text/csv; charset=UTF-8');
        $response->headers->set('Content-Disposition', 'attachment; filename="paiements-' . $groupe->id . '.csv"');
        return $response;
    }

    public function pdf(Request $request, Groupe $groupe)
    {
        $this->authorize($request, $groupe);
        $paiements = $groupe->paiements()->with('membre')->orderBy('date_paiement', 'desc')->limit(500)->get();
        $total = (int) $paiements->where('statut', 'reussi')->sum('montant');
        $pdf = Pdf::loadView('rapport', [
            'groupe' => $groupe,
            'paiements' => $paiements,
            'total' => $total,
            'date' => now(),
        ]);
        return $pdf->download('rapport-' . $groupe->id . '.pdf');
    }

    protected function authorize(Request $request, Groupe $groupe): void
    {
        abort_unless($groupe->gestionnaire_id === $request->user()->id || $request->user()->role === 'super_admin', 403);
    }
}
