<?php
namespace Database\Factories;
use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;
class ProjectFactory extends Factory {
    protected $model = Project::class;
    public function definition(): array { return ['code'=>fake()->unique()->bothify('PRJ-###'),'name'=>fake()->company().' Development','name_km'=>'គម្រោងអភិវឌ្ឍន៍','type'=>'residential','location'=>'Phnom Penh','status'=>'selling','reporting_currency'=>'USD','description'=>'Seeded development project for local testing.']; }
}
