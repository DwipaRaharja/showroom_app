<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Fortify\Features;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        $this->ensureSafeTestDatabase();

        parent::setUp();
    }

    /**
     * Stop database-refreshing tests before Laravel connects to an unsafe database.
     */
    private function ensureSafeTestDatabase(): void
    {
        $environment = $this->environmentVariable('APP_ENV');
        $database = $this->environmentVariable('DB_DATABASE');
        $isTestDatabase = is_string($database)
            && (str_ends_with($database, '_test') || preg_match('/_test_\d+$/', $database) === 1);

        if ($environment !== 'testing' || ! $isTestDatabase) {
            throw new RuntimeException(sprintf(
                'Refusing to run feature tests: APP_ENV must be [testing] and DB_DATABASE must end with [_test]. Current APP_ENV: [%s], DB_DATABASE: [%s].',
                $environment ?? 'not set',
                $database ?? 'not set',
            ));
        }
    }

    private function environmentVariable(string $name): ?string
    {
        $value = $_ENV[$name] ?? $_SERVER[$name] ?? getenv($name);

        return is_string($value) ? $value : null;
    }

    protected function skipUnlessFortifyHas(string $feature, ?string $message = null): void
    {
        if (! Features::enabled($feature)) {
            $this->markTestSkipped($message ?? "Fortify feature [{$feature}] is not enabled.");
        }
    }
}
