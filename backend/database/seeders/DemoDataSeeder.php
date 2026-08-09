<?php

namespace Database\Seeders;
use Illuminate\Support\Facades\DB;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DemoDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
          DB::table('jobs')->insert([
        [
           'title' => 'Frontend Developer (React)',
            'company' => 'Atlas Digital Solutions',
            'location' => 'Fes, Morocco',
            'salary' => 8000,
            'description' => 'We are looking for a React developer to build modern web interfaces.',
            'requirements' => json_encode([
                'Good knowledge of HTML, CSS, JavaScript',
                'Experience with React.js',
                'Understanding of REST APIs',
                'Git basics'])

        ],
        [
           
            'title' => 'UI/UX Designer',
            'company' => 'Creative Pixels Agency',
            'location' => 'Marrakech, Morocco',
            'salary' => 7000,
            'description' => 'Design modern and clean user interfaces.',
            'requirements' => json_encode([
                'Figma or Adobe XD',
                'UI/UX principles',
                'Portfolio required',
                'Creativity & attention to detail'])
        ],
        [
            'title' => 'DevOps Engineer',
            'company' => 'CloudNova Systems',
            'location' => 'Remote',
            'salary' => 15000,
            'description' => 'Manage cloud infrastructure and CI/CD pipelines.',
            'requirements' => json_encode([
                'Linux basics',
                'Docker knowledge',
                'CI/CD pipelines',
                'Cloud platforms (AWS or Azure)'])
        ],
        [
              'title' => 'Backend Developer (Laravel)',
            'company' => 'Morocco Tech Hub',
            'location' => 'Casablanca, Morocco',
            'salary' => 10000,
            'description' => 'Develop and maintain scalable backend APIs using Laravel.',
            'requirements' => json_encode([
                'Strong PHP knowledge',
                'Laravel experience',
                'MySQL database skills',
                'API development (REST)'])
        ],
          ]
          );
    }
};








