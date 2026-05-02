<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Groupe;
use App\Models\Membre;
use App\Models\Paiement;
use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class CarteController extends Controller
{
    public function show(Request $request, Groupe $groupe, Membre $membre)
    {
        $this->authorize($request, $groupe, $membre);
        abort_unless($membre->groupe_id === $groupe->id, 404);
        $frontUrl = env('FRONTEND_URL', 'http://localhost:3000');
        $url = $frontUrl . '/carte/' . $membre->id . '?token=' . sha1($membre->id . '.' . $groupe->id . '.' . config('app.key'));
        $builder = new Builder(
            writer: new PngWriter(),
            data: $url,
            encoding: new Encoding('UTF-8'),
            size: 260,
            margin: 6
        );
        $qr = $builder->build();
        return response()->json([
            'membre' => $membre,
            'groupe' => $groupe,
            'qr_png_base64' => base64_encode($qr->getString()),
            'qr_url' => $url,
        ]);
    }

    public function pdf(Request $request, Groupe $groupe, Membre $membre)
    {
        $this->authorize($request, $groupe, $membre);
        $frontUrl = env('FRONTEND_URL', 'http://localhost:3000');
        $url = $frontUrl . '/carte/' . $membre->id . '?token=' . sha1($membre->id . '.' . $groupe->id . '.' . config('app.key'));
        $builder = new Builder(
            writer: new PngWriter(),
            data: $url,
            encoding: new Encoding('UTF-8'),
            size: 220,
            margin: 6
        );
        $qr = $builder->build();
        $qrB64 = base64_encode($qr->getString());
        $pdf = Pdf::loadView('carte', [
            'membre' => $membre,
            'groupe' => $groupe,
            'qr' => $qrB64,
        ])->setPaper([0, 0, 260, 400]);
        return $pdf->download('carte-' . $membre->id . '.pdf');
    }

    // Endpoint public consulté via QR code
    public function publicHistory(Request $request, Membre $membre)
    {
        $expected = sha1($membre->id . '.' . $membre->groupe_id . '.' . config('app.key'));
        abort_unless(hash_equals($expected, (string) $request->get('token')), 403);
        $paiements = Paiement::where('membre_id', $membre->id)->latest('date_paiement')->get(['id','type','montant','mode','statut','date_paiement']);
        return response()->json([
            'membre' => ['nom' => $membre->nom, 'prenom' => $membre->prenom, 'role' => $membre->role],
            'groupe' => ['nom' => $membre->groupe->nom],
            'paiements' => $paiements,
        ]);
    }

    protected function authorize(Request $request, Groupe $groupe, Membre $membre): void
    {
        $u = $request->user();
        if ($u->role === 'super_admin') return;
        if ($groupe->gestionnaire_id === $u->id) return;
        if ($membre->user_id === $u->id) return;
        abort(403);
    }
}
