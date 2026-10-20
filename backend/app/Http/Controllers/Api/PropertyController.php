<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\PropertyUnit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
class PropertyController extends Controller {
    public function projects(): JsonResponse { return response()->json(Project::withCount(['propertyUnits as total_units','propertyUnits as available_units' => fn ($query) => $query->where('status','available')])->latest()->get()); }
    public function storeProject(Request $request): JsonResponse {
        $data = $request->validate(['code'=>['required','string','max:32','unique:projects,code'],'name'=>['required','string','max:255'],'name_km'=>['nullable','string','max:255'],'type'=>['required','string','max:40'],'location'=>['nullable','string','max:255'],'status'=>['sometimes',Rule::in(['planning','active','selling','completed','suspended','archived'])],'reporting_currency'=>['sometimes',Rule::in(['USD','KHR'])],'description'=>['nullable','string']]);
        return response()->json(Project::create($data), 201);
    }
    public function units(Request $request): JsonResponse {
        $query = PropertyUnit::with('project:id,code,name')->latest();
        if ($request->filled('status')) $query->where('status',$request->string('status'));
        if ($request->filled('project_id')) $query->where('project_id',$request->integer('project_id'));
        if ($request->filled('search')) $query->where('unit_code','like','%'.$request->string('search').'%');
        return response()->json($query->paginate(min($request->integer('per_page',20),100)));
    }
    public function storeUnit(Request $request): JsonResponse {
        $data = $request->validate(['project_id'=>['required','integer','exists:projects,id'],'unit_code'=>['required','string','max:40'],'zone'=>['nullable','string','max:100'],'property_type'=>['required','string','max:40'],'land_area'=>['nullable','numeric','min:0'],'building_area'=>['nullable','numeric','min:0'],'listing_price'=>['required','numeric','min:0'],'currency'=>['required',Rule::in(['USD','KHR'])],'status'=>['sometimes',Rule::in(['available','reserved','deposit_paid','contract_signed','installment_active','fully_paid','transferred','on_hold','cancelled'])]]);
        if (PropertyUnit::where('project_id',$data['project_id'])->where('unit_code',$data['unit_code'])->exists()) return response()->json(['message'=>'Unit code already exists in this project.'],422);
        return response()->json(PropertyUnit::create($data)->load('project:id,code,name'),201);
    }
}
