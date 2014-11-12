#!/opt/local/bin/perl -w

use strict;
use XML::Twig;
use JSON;
use Search::Elasticsearch;
use Time::Piece;
use Try::Tiny;

# To get the mapping right, use these commands:
#curl -XPUT 'http://localhost:9200/nih/'
#curl -XPUT 'http://localhost:9200/nih/_mapping/full' -d '
#{
#  "full": {
#    "properties": {
#      "total_cost": {"type": "integer"},
#      "activity": {"type": "string", "index": "not_analyzed"},
#      "administering_ic": {"type": "string", "index": "not_analyzed"},
#      "application_type": {"type": "string", "index": "not_analyzed"},
#      "foa_number": {"type": "string", "index": "not_analyzed"},
#      "funding_institute": {"type": "string", "index": "not_analyzed"},
#      "fy": {"type": "integer"},
#      "project_number": {"type": "string", "index": "not_analyzed"},
#      "award_notice_date": {"type": "date"},
#      "budget_start": {"type": "date"},
#      "budget_end": {"type": "date"},
#      "project_start": {"type": "date"},
#      "project_end": {"type": "date"}
#    }
#  }
#}'

my $e = Search::Elasticsearch->new(
    #nodes => ['192.168.59.103:9200']
    nodes => ['localhost:9200']
);
my $twig = XML::Twig->new(
    twig_handlers => {
        row => \&jsonify_row
    }
);
#$twig->parsefile('data/RePORTER_PRJ_X_FY2014_170.xml');
my @files = glob("data/RePORTER_PRJ_X_FY*.xml");
for my $file (@files) {
    $twig->parsefile($file);
}
#my $root = $twig->root;
#my @rows = $root->children('row');
#foreach my $row (@rows) {
sub jsonify_row {
    my ($t, $row) = @_;
    my $application_id = $row->first_child('APPLICATION_ID')->text;
    my $funding_institute = $row->first_child('FUNDING_ICs ')->text;
    ($funding_institute) = $funding_institute =~ m/(^[^:]+)/;
    my $term_elem = $row->first_child('PROJECT_TERMSX');
    my @terms = ();
    if (defined $term_elem) {
        my @term_elems = $term_elem->children('TERM');
        for my $term_elem (@term_elems) {
            push @terms, $term_elem->text;
        }
    }
    my $data = {
        application_id => $application_id,
        activity => $row->first_child('ACTIVITY')->text,
        administering_ic => $row->first_child('ADMINISTERING_IC')->text,
        application_type => $row->first_child('APPLICATION_TYPE')->text,
        total_cost => $row->first_child('TOTAL_COST')->text,
        foa_number => $row->first_child('FOA_NUMBER')->text,
        project_number => $row->first_child('FULL_PROJECT_NUM')->text,
        fy => $row->first_child('FY')->text,
        title => $row->first_child('PROJECT_TITLE')->text,
        phr => $row->first_child('PHR')->text,
        funding_institute => $funding_institute,
        terms => \@terms
    };
    addDate($data, 'award_notice_date', $row->first_child('AWARD_NOTICE_DATE')->text);
    addDate($data, 'budget_start', $row->first_child('BUDGET_START')->text);
    addDate($data, 'budget_end', $row->first_child('BUDGET_END')->text);
    addDate($data, 'project_start', $row->first_child('PROJECT_START')->text);
    addDate($data, 'project_end', $row->first_child('PROJECT_END')->text);
    try {
        $e->index(
            index => 'nih',
            type => 'full',
            id => $application_id,
            body => $data
        );
    } catch {
        warn "caught error: $_";
    };
    #print encode_json($data) . "\n";
    $t->purge;
}

sub addDate {
    my ($data, $fieldname, $oldDate) = @_;
    try {
        if ($oldDate ne "") {
            $data->{$fieldname} = Time::Piece->strptime($oldDate, "%m/%d/%Y")->strftime("%F");
        }
    } catch {
    }
}
