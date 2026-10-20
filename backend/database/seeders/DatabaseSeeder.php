<?php
namespace Database\Seeders;
use App\Models\Project;
use App\Models\PropertyUnit;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
class DatabaseSeeder extends Seeder {
    use WithoutModelEvents;
    public function run(): void {
        User::factory()->create(['name'=>'Demo Administrator','email'=>'admin@example.com']);
        $projects = Project::factory()->count(3)->create();
        $projects->each(function (Project $project): void { PropertyUnit::factory()->count(8)->for($project)->create(); });
    }
}

