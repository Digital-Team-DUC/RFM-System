<?php
namespace Tests\Feature;
use App\Models\Project;
use App\Models\PropertyUnit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class PropertyApiTest extends TestCase {
    use RefreshDatabase;
    public function test_project_and_unit_can_be_created(): void {
        $project = $this->postJson('/api/projects',['code'=>'PRJ-001','name'=>'Mekong Gardens','type'=>'residential'])->assertCreated()->json('id');
        $this->postJson('/api/property-units',['project_id'=>$project,'unit_code'=>'A-01','property_type'=>'land_plot','listing_price'=>65000,'currency'=>'USD'])->assertCreated()->assertJsonPath('unit_code','A-01');
        $this->assertDatabaseHas('property_units',['project_id'=>$project,'unit_code'=>'A-01']);
    }
    public function test_duplicate_unit_codes_are_rejected_within_a_project(): void {
        $project = Project::factory()->create(); PropertyUnit::factory()->for($project)->create(['unit_code'=>'A-01']);
        $this->postJson('/api/property-units',['project_id'=>$project->id,'unit_code'=>'A-01','property_type'=>'land_plot','listing_price'=>65000,'currency'=>'USD'])->assertStatus(422);
    }
}
